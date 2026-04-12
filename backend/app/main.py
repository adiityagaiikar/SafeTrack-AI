from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from app.core.config import settings
import base64
import json
import time
import numpy as np
import cv2
import os
from ultralytics import YOLO

# ── Firebase init ──────────────────────────────────────────────────────────────
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin initialized successfully.")
except Exception as e:
    print(f"Failed to initialize Firebase Admin: {e}")

# ── YOLO model — loaded once at startup, shared across connections ─────────────
# Dynamic path: resolves relative to this file so it works from any cwd
_LIVE_MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "detection", "yolov8n.pt"
)
try:
    _yolo_model = YOLO(os.path.normpath(_LIVE_MODEL_PATH))
    print(f"YOLO model loaded for live spatial tracking: {os.path.normpath(_LIVE_MODEL_PATH)}")
except Exception as e:
    _yolo_model = None
    print(f"YOLO model failed to load: {e}")

# ── Spatial engine constants ───────────────────────────────────────────────────
REAL_WORLD_CAR_WIDTH = 1.8   # metres  (average vehicle width)
FOCAL_LENGTH         = 700   # pixels  (empirically calibrated)
HAZARD_DISTANCE      = 3.0   # metres  — triggers full hazard alert
PROXIMITY_DISTANCE   = 5.0   # metres  — triggers proximity warning
VEHICLE_CLASSES      = [2, 3, 5, 7]  # COCO: car, motorcycle, bus, truck
FRAME_SKIP           = 2     # process every Nth frame per connection

# Confidence thresholds — kept in sync with detection/detection.py
CONF_GENERAL  = 0.25   # base detection threshold
CONF_CRITICAL = 0.60   # high-confidence filter for CRITICAL alerts
_LIVE_IOU     = 0.45   # mutable IoU — updated via /api/model/config


def calculate_spatial_data(pixel_width: float) -> float:
    """Triangle Similarity: distance = (real_width * focal_length) / pixel_width."""
    if pixel_width <= 0:
        return 0.0
    return round((REAL_WORLD_CAR_WIDTH * FOCAL_LENGTH) / pixel_width, 2)


def classify_status(velocity: float) -> str:
    """Classify motion status from velocity (m/s)."""
    if abs(velocity) < 0.15:   # noise floor
        return "static"
    return "approaching" if velocity < 0 else "receding"


# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI-Based Video Accident Detection API",
    description="Backend API for processing videos for accident detection and reporting.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running successfully!"}


# ── Live-feed WebSocket — ByteTrack + Spatial Engine ──────────────────────────
@app.websocket("/ws/live-feed")
async def live_video_feed(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Client connected to /ws/live-feed")

    # Per-connection state — isolated so multiple clients don't share history
    prev_distances: dict[int, float] = {}   # track_id -> last known distance
    prev_timestamp: float = time.monotonic()
    frame_counter: int = 0

    try:
        while True:
            raw = await websocket.receive_text()
            frame_counter += 1

            # ── Frame skip: only process every FRAME_SKIP-th frame ────────
            # Still decode to keep ByteTrack's internal state warm, but skip
            # heavy inference on skipped frames and return last payload fast.
            skip_inference = (frame_counter % FRAME_SKIP != 0)

            # ── Decode incoming JPEG frame ─────────────────────────────────
            try:
                payload   = json.loads(raw)
                frame_b64 = payload.get("frame", "")
                if not frame_b64:
                    await websocket.send_json({"status": "ok", "providerTitle": "YOLOv8 Spatial Engine", "detections": []})
                    continue

                if "," in frame_b64:
                    frame_b64 = frame_b64.split(",", 1)[1]

                img_bytes = base64.b64decode(frame_b64)
                np_arr    = np.frombuffer(img_bytes, dtype=np.uint8)
                frame     = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                if frame is None:
                    await websocket.send_json({"status": "ok", "providerTitle": "YOLOv8 Spatial Engine", "detections": []})
                    continue

            except Exception as decode_err:
                print(f"[WS] Frame decode error: {decode_err}")
                await websocket.send_json({"status": "ok", "providerTitle": "YOLOv8 Spatial Engine", "detections": []})
                continue

            if skip_inference:
                # Return empty detections on skipped frames — frontend
                # interpolates using the last received payload.
                await websocket.send_json({"status": "ok", "providerTitle": "YOLOv8 Spatial Engine", "detections": [], "skipped": True})
                continue

            # ── Timing for velocity calculation ───────────────────────────
            now        = time.monotonic()
            frame_time = max(now - prev_timestamp, 0.001)  # avoid div/0
            prev_timestamp = now

            # ── ByteTrack inference ────────────────────────────────────────
            detections: list[dict] = []

            if _yolo_model is not None:
                try:
                    results = _yolo_model.track(
                        frame,
                        persist=True,
                        tracker="bytetrack.yaml",
                        conf=CONF_GENERAL,
                        iou=_LIVE_IOU,
                        verbose=False,
                        classes=VEHICLE_CLASSES,
                    )

                    if results and results[0].boxes is not None:
                        for box in results[0].boxes:
                            if box.id is None:
                                continue  # not yet confirmed by tracker

                            track_id        = int(box.id.item())
                            cls_idx         = int(box.cls.item())
                            confidence      = round(float(box.conf.item()), 3)
                            x1, y1, x2, y2 = [round(float(v), 1) for v in box.xyxy[0].tolist()]
                            pixel_width     = x2 - x1
                            distance        = calculate_spatial_data(pixel_width)
                            label           = _yolo_model.names.get(cls_idx, f"cls_{cls_idx}")

                            # ── Velocity (m/s) ─────────────────────────────
                            if track_id in prev_distances and distance > 0:
                                raw_vel  = (distance - prev_distances[track_id]) / frame_time
                                velocity = round(raw_vel, 2)
                            else:
                                velocity = 0.0

                            if distance > 0:
                                prev_distances[track_id] = distance

                            status = classify_status(velocity)

                            # Convert velocity to km/h for the payload
                            velocity_kmh = round(velocity * 3.6, 1)

                            detections.append({
                                "id":           track_id,
                                "label":        label,
                                "confidence":   confidence,
                                "is_critical":  confidence >= CONF_CRITICAL,
                                "distance":     distance,
                                "velocity":     velocity_kmh,   # km/h, negative = approaching
                                "status":       status,
                                "box":          [x1, y1, x2, y2],
                            })

                    # Prune stale track IDs to prevent unbounded memory growth
                    active_ids = {d["id"] for d in detections}
                    stale      = [k for k in prev_distances if k not in active_ids]
                    for k in stale:
                        del prev_distances[k]

                except Exception as infer_err:
                    print(f"[WS] Inference error: {infer_err}")

            # ── Hazard classification ──────────────────────────────────────
            hazard_alert    = any(
                d["status"] == "approaching" and d["distance"] > 0 and d["distance"] < HAZARD_DISTANCE
                for d in detections
            )
            proximity_alert = any(
                d["distance"] > 0 and d["distance"] < PROXIMITY_DISTANCE
                for d in detections
            )

            # collision_vector: true if any tracked vehicle is closing faster
            # than 1 m/s (velocity is stored as km/h, negative = approaching)
            collision_vector = any(
                d["status"] == "approaching" and abs(d["velocity"]) >= 3.6  # 1 m/s = 3.6 km/h
                for d in detections
            )

            await websocket.send_json({
                "status":           "ok",
                "providerTitle":    "YOLOv8 Spatial Engine",
                "detections":       detections,
                "vehicle_count":    len(detections),
                "hazard_alert":     hazard_alert,
                "proximity_alert":  proximity_alert,
                "collision_vector": collision_vector,
                "telemetry": {
                    "vehicle_count":    len(detections),
                    "hazard_alert":     hazard_alert,
                    "proximity_alert":  proximity_alert,
                    "collision_vector": collision_vector,
                    "tracked_ids":      [d["id"] for d in detections],
                    "frame_time_ms":    round(frame_time * 1000, 1),
                },
            })

    except WebSocketDisconnect:
        print("[WS] Client disconnected from /ws/live-feed")
    except Exception as e:
        print(f"[WS] Unexpected error: {e}")


# ── Routers ────────────────────────────────────────────────────────────────────
from app.routes import video, user, report, payment, sos, analytics, model_config
app.include_router(video.router,         prefix="/api/video",   tags=["Video"])
app.include_router(user.router,          prefix="/api/user",    tags=["User"])
app.include_router(report.router,        prefix="/api/report",  tags=["Report"])
app.include_router(payment.router,       prefix="/api/payment", tags=["Payment"])
app.include_router(sos.router,           prefix="/api/sos",     tags=["SOS"])
app.include_router(analytics.router,     prefix="/api",         tags=["Analytics"])
app.include_router(model_config.router,  prefix="/api",         tags=["Model Config"])
