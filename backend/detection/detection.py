import cv2
import os
import time
import numpy as np
from collections import deque
from ultralytics import YOLO

# Dynamic path — works regardless of where the script is invoked from
_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'yolov8n.pt')
model = YOLO(_MODEL_PATH)

# ── COCO vehicle class IDs — ONLY these classes participate in collision logic ─
VEHICLE_CLASSES = {2, 3, 5, 7}   # car, motorcycle, bus, truck

# Detection thresholds
CONF_GENERAL          = 0.30   # raised from 0.25 — filter out low-quality detections
CONF_CRITICAL         = 0.60   # high-confidence filter for severity classification
IOU_THRESHOLD         = 0.45   # NMS suppression — prevents box doubling
TEMPORAL_WINDOW       = 3      # frames kept for moving-average smoothing

# ── Three-gate accident confirmation thresholds ──────────────────────────────
COLLISION_IOU_TRIGGER  = 0.45  # raised from 0.2 — only real physical overlap counts
MIN_COLLISION_DIST_PX  = 30    # lowered from 50 — centre-to-centre must be VERY close
TEMPORAL_GLITCH_FRAMES = 15    # raised from 10 — must persist ≥15 consecutive frames
VELOCITY_DROP_RATIO    = 0.30  # tightened — current speed must be ≤ 30% of rolling avg (70% drop)
VELOCITY_HISTORY_LEN   = 8     # raised from 5 — longer rolling average is more stable
MIN_MEANINGFUL_SPEED   = 8.0   # px/frame — object must have been moving at this speed before drop counts
PROLONGED_STATIONARY   = 150   # raised from 30 — ~5 seconds at 30fps, as last-resort safety net

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


def _box_centre(box: list) -> tuple[float, float]:
    """Return the (cx, cy) centre of an [x1, y1, x2, y2] box."""
    return ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2)


def calculate_iou(box1, box2) -> float:
    x1 = max(box1[0], box2[0]);  y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2]);  y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0


def _pixel_speed(box_prev: list, box_curr: list) -> float:
    """Euclidean displacement of box centres between two frames (px/frame)."""
    cx1, cy1 = _box_centre(box_prev)
    cx2, cy2 = _box_centre(box_curr)
    return ((cx2 - cx1) ** 2 + (cy2 - cy1) ** 2) ** 0.5


def _check_velocity_drop(vel_histories: dict, involved_indices: list) -> bool:
    """
    Return True if at least one of the involved objects has experienced a
    GENUINE crash-like velocity drop:
      - The object was previously moving at a meaningful speed (rolling avg > MIN_MEANINGFUL_SPEED)
      - Its current speed dropped to ≤ VELOCITY_DROP_RATIO of the rolling average
    """
    for idx in involved_indices:
        history = vel_histories.get(idx)
        if not history or len(history) < 3:
            continue
        # Use all-but-last entries for the "before" average, last entry for "now"
        before = list(history)[:-1]
        rolling_avg = sum(before) / len(before)
        current     = history[-1]
        # Object must have been moving at a meaningful speed, then suddenly stopped
        if rolling_avg > MIN_MEANINGFUL_SPEED and current <= rolling_avg * VELOCITY_DROP_RATIO:
            return True
    return False


def detect_accident(video_path: str) -> dict:
    """
    Process a video file and return a structured detection result.

    Three-gate accident confirmation (ALL must pass simultaneously):
      1. Spatial overlap — IoU > 0.45 between two VEHICLE bounding boxes,
         OR centre-to-centre distance < 30 px
      2. Temporal persistence — overlap persists for ≥ 15 consecutive frames
      3. Velocity drop — at least one vehicle was moving at meaningful speed
         and shows ≥ 70% sudden deceleration

    Only COCO vehicle classes (car, motorcycle, bus, truck) are considered.
    Non-vehicle detections (people, animals, objects) are excluded entirely.

    Returns:
        {
            "accident": bool,
            "severity": "HIGH" | "MEDIUM" | "LOW" | "NONE",
            "collision_count": int,
            "max_confidence": float,
            "frames_processed": int,
        }
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")

    accident_detected         = False
    consecutive_collision_cnt = 0        # gate 2: temporal persistence counter
    prolonged_collision_cnt   = 0        # last-resort stationary counter
    collision_count           = 0        # total collision-candidate pair×frame count
    frames_processed          = 0
    max_confidence            = 0.0
    last_boxes: list          = []

    # Per-object velocity history (index → deque of speeds)
    vel_histories: dict[int, deque] = {}

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

        # ── Build per-frame detection list — VEHICLE CLASSES ONLY ────────────
        raw_dets: list[dict] = []
        for box in results[0].boxes:
            conf_val = float(box.conf.item())
            cls_val  = int(box.cls.item())

            # CRITICAL FILTER: skip non-vehicle detections entirely
            if cls_val not in VEHICLE_CLASSES:
                continue

            xyxy = box.xyxy[0].cpu().numpy().tolist()
            raw_dets.append({"box": xyxy, "conf": conf_val, "cls": cls_val})
            if conf_val > max_confidence:
                max_confidence = conf_val

        # ── Temporal smoothing ───────────────────────────────────────────────
        det_buffer.append(raw_dets)
        dets = _smooth_detections(det_buffer)

        # ── Update per-object velocity histories ─────────────────────────────
        for i, det in enumerate(dets):
            if i < len(last_boxes):
                speed = _pixel_speed(last_boxes[i]["box"], det["box"])
            else:
                speed = 0.0
            if i not in vel_histories:
                vel_histories[i] = deque(maxlen=VELOCITY_HISTORY_LEN)
            vel_histories[i].append(speed)

        # Prune stale indices from velocity history
        active_indices = set(range(len(dets)))
        stale = [k for k in vel_histories if k not in active_indices]
        for k in stale:
            del vel_histories[k]

        # ── Gate 1: Spatial overlap between VEHICLE pairs ────────────────────
        collision_this_frame = False
        involved_objects: list[int] = []

        for i in range(len(dets)):
            for j in range(i + 1, len(dets)):
                b1, b2 = dets[i]["box"], dets[j]["box"]

                # Gate 1a: IoU overlap — must be substantial (> 0.45)
                iou = calculate_iou(b1, b2)
                spatial_overlap = iou > COLLISION_IOU_TRIGGER

                # Gate 1b: Centre proximity — extremely close only
                if not spatial_overlap:
                    cx1, cy1 = _box_centre(b1)
                    cx2, cy2 = _box_centre(b2)
                    pixel_dist = ((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2) ** 0.5
                    spatial_overlap = pixel_dist < MIN_COLLISION_DIST_PX

                if spatial_overlap:
                    collision_this_frame = True
                    collision_count += 1
                    involved_objects.extend([i, j])

        # ── Gate 2: Temporal persistence ─────────────────────────────────────
        if collision_this_frame:
            consecutive_collision_cnt += 1
            prolonged_collision_cnt  += 1
        else:
            consecutive_collision_cnt = 0
            prolonged_collision_cnt   = 0

        # ── Gate 3: Velocity drop — only when gates 1+2 pass ────────────────
        if consecutive_collision_cnt >= TEMPORAL_GLITCH_FRAMES and not accident_detected:
            unique_involved = list(set(involved_objects))
            velocity_drop = _check_velocity_drop(vel_histories, unique_involved)

            if velocity_drop:
                accident_detected = True
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
                      f"ACCIDENT CONFIRMED — 3-gate filter passed: "
                      f"spatial overlap (IoU>{COLLISION_IOU_TRIGGER}) "
                      f"+ {consecutive_collision_cnt} consecutive frames "
                      f"+ velocity drop detected (>{int((1-VELOCITY_DROP_RATIO)*100)}% decel)")

        # ── Last-resort safety-net: extreme prolonged stationary overlap ─────
        # Only fires after ~5 seconds of continuous overlap — virtually
        # impossible in normal driving. Still requires velocity drop.
        if prolonged_collision_cnt >= PROLONGED_STATIONARY and not accident_detected:
            unique_involved = list(set(involved_objects))
            velocity_drop = _check_velocity_drop(vel_histories, unique_involved)
            if velocity_drop:
                accident_detected = True
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] "
                      f"Accident — prolonged stationary overlap "
                      f"({PROLONGED_STATIONARY} frames) + velocity drop confirmed")

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

