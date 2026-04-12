import cv2
import os
import time
import numpy as np
from collections import deque
from ultralytics import YOLO

# Dynamic path — works regardless of where the script is invoked from
_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'yolov8n.pt')
model = YOLO(_MODEL_PATH)

# Detection thresholds
CONF_GENERAL          = 0.25   # base detection threshold
CONF_CRITICAL         = 0.60   # high-confidence filter for CRITICAL alerts
IOU_THRESHOLD         = 0.45   # NMS suppression — prevents box doubling
SPEED_THRESHOLD       = 5.0    # px/s below which a sudden stop is flagged
PROLONGED_FRAMES      = 30     # consecutive frames to confirm prolonged collision
MIN_COLLISION_DIST    = 50     # pixel proximity that triggers proximity alert
TEMPORAL_WINDOW       = 3      # frames kept for moving-average smoothing
COLLISION_IOU_TRIGGER = 0.2    # IoU above which two boxes are "colliding"

# CLAHE pre-processor (applied per-frame before inference)
_clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))


def _apply_clahe(frame: np.ndarray) -> np.ndarray:
    """Convert to LAB, apply CLAHE on L-channel, convert back to BGR."""
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l_eq = _clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l_eq, a, b]), cv2.COLOR_LAB2BGR)


def _letterbox(frame: np.ndarray, target: int = 640) -> np.ndarray:
    """
    Resize frame to target×target while preserving aspect ratio (letterbox).
    Pads with grey so vehicles are never squashed/stretched.
    """
    h, w = frame.shape[:2]
    scale = target / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((target, target, 3), 114, dtype=np.uint8)
    pad_top  = (target - new_h) // 2
    pad_left = (target - new_w) // 2
    canvas[pad_top:pad_top + new_h, pad_left:pad_left + new_w] = resized
    return canvas


def _smooth_detections(buffer: deque) -> list[dict]:
    """
    3-frame moving average over bounding-box coordinates.
    Each entry in buffer is a list of dicts with keys: box, conf, cls.
    Returns smoothed detections from the latest frame when box counts match;
    otherwise falls back to the most recent frame's raw detections.
    """
    if not buffer:
        return []
    counts = [len(f) for f in buffer]
    latest = buffer[-1]
    if len(set(counts)) == 1 and counts[0] > 0:
        smoothed = []
        for i, det in enumerate(latest):
            avg_box = np.mean(
                [list(buffer[t][i]["box"]) for t in range(len(buffer))], axis=0
            ).tolist()
            smoothed.append({"box": avg_box, "conf": det["conf"], "cls": det["cls"]})
        return smoothed
    return latest


def calculate_iou(box1, box2) -> float:
    x1 = max(box1[0], box2[0]);  y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2]);  y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0


def calculate_speed(box1, box2, time_diff: float) -> float:
    dist = ((box1[0] - box2[0]) ** 2 + (box1[1] - box2[1]) ** 2) ** 0.5
    return dist / time_diff if time_diff > 0 else 0.0


def detect_accident(video_path: str) -> dict:
    """
    Process a video file and return a structured detection result.

    Returns:
        {
            "accident": bool,
            "severity": "HIGH" | "MEDIUM" | "LOW" | "NONE",
            "collision_count": int,
            "max_confidence": float,   # highest conf seen across all frames
            "frames_processed": int,
        }
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    accident_detected       = False
    frame_counter           = 0
    collision_count         = 0
    prolonged_collision_cnt = 0
    frames_processed        = 0
    max_confidence          = 0.0
    last_boxes: list        = []

    # Rolling buffer for temporal smoothing
    det_buffer: deque = deque(maxlen=TEMPORAL_WINDOW)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frames_processed += 1

        # ── Pre-processing ───────────────────────────────────────────────────
        enhanced = _apply_clahe(frame)
        prepared = _letterbox(enhanced, target=640)

        # ── Inference ────────────────────────────────────────────────────────
        results = model.predict(
            prepared,
            conf=CONF_GENERAL,
            iou=IOU_THRESHOLD,
            augment=True,
            verbose=False,
        )

        # Build per-frame detection list (preserves conf + cls alongside box)
        raw_dets: list[dict] = []
        for box in results[0].boxes:
            conf_val = float(box.conf.item())
            cls_val  = int(box.cls.item())
            xyxy     = box.xyxy[0].cpu().numpy().tolist()
            raw_dets.append({"box": xyxy, "conf": conf_val, "cls": cls_val})
            if conf_val > max_confidence:
                max_confidence = conf_val

        # ── Temporal smoothing ───────────────────────────────────────────────
        det_buffer.append(raw_dets)
        dets = _smooth_detections(det_buffer)

        # ── Collision logic ──────────────────────────────────────────────────
        collision_this_frame = False
        for i in range(len(dets)):
            for j in range(i + 1, len(dets)):
                b1, b2 = dets[i]["box"], dets[j]["box"]
                iou = calculate_iou(b1, b2)

                if iou > COLLISION_IOU_TRIGGER:
                    collision_this_frame = True
                    collision_count += 1
                    prolonged_collision_cnt += 1

                    # High-confidence filter: CRITICAL alert only if both
                    # detections exceed the critical confidence threshold
                    if (dets[i]["conf"] > CONF_CRITICAL and
                            dets[j]["conf"] > CONF_CRITICAL):
                        accident_detected = True
                        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
                              f"CRITICAL collision — obj {i} & {j} "
                              f"(conf {dets[i]['conf']:.2f}/{dets[j]['conf']:.2f})")

                    if prolonged_collision_cnt >= PROLONGED_FRAMES:
                        accident_detected = True
                        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
                              f"Accident — prolonged collision ({PROLONGED_FRAMES} frames)")

                dist = ((b1[0] - b2[0]) ** 2 + (b1[1] - b2[1]) ** 2) ** 0.5
                if dist < MIN_COLLISION_DIST:
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
                          f"Accident — close proximity obj {i} & {j}")

        # Speed check against previous frame
        for i, det in enumerate(dets):
            if i < len(last_boxes):
                speed = calculate_speed(last_boxes[i]["box"], det["box"], 1)
                if speed < SPEED_THRESHOLD:
                    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
                          f"Sudden stop — object {i} (speed {speed:.2f} px/s)")

        if collision_this_frame:
            frame_counter += 1
            if frame_counter >= 120:
                accident_detected = True
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
                      f"Accident — no movement for 2 min")
        else:
            frame_counter = 0
            prolonged_collision_cnt = 0

        last_boxes = dets

    cap.release()

    # ── Severity classification ──────────────────────────────────────────────
    if accident_detected and max_confidence >= CONF_CRITICAL:
        severity = "HIGH"
    elif accident_detected:
        severity = "MEDIUM"
    elif collision_count > 0:
        severity = "LOW"
    else:
        severity = "NONE"

    print(f"[detect_accident] frames={frames_processed}, "
          f"collisions={collision_count}, accident={accident_detected}, "
          f"severity={severity}, max_conf={max_confidence:.3f}")

    return {
        "accident":         accident_detected,
        "severity":         severity,
        "collision_count":  collision_count,
        "max_confidence":   round(max_confidence, 3),
        "frames_processed": frames_processed,
    }
