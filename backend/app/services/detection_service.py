import os
import uuid
import requests
from detection.detection import detect_accident


def process_video_detection(video_url: str) -> dict:
    """
    Downloads a video from the given URL, runs the optimised YOLO detection
    pipeline, cleans up the temp file, and returns the structured result.

    Returns:
        {
            "accident":         bool,
            "severity":         "HIGH" | "MEDIUM" | "LOW" | "NONE",
            "collision_count":  int,
            "max_confidence":   float,
            "frames_processed": int,
        }
    """
    temp_dir = "uploads"
    os.makedirs(temp_dir, exist_ok=True)

    local_path = os.path.join(temp_dir, f"temp_{uuid.uuid4().hex}.mp4")

    # 1. Download video to a temp file
    try:
        response = requests.get(video_url, stream=True, timeout=60)
        response.raise_for_status()
        with open(local_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
    except Exception as e:
        raise Exception(f"Failed to download video from {video_url}: {e}")

    # 2. Run detection pipeline and capture structured result
    try:
        result = detect_accident(local_path)
        return result
    except Exception as e:
        print(f"[detection_service] Detection error: {e}")
        # Return a safe fallback so the API never 500s on a bad video
        return {
            "accident":         False,
            "severity":         "NONE",
            "collision_count":  0,
            "max_confidence":   0.0,
            "frames_processed": 0,
        }
    finally:
        # 3. Always clean up the temp file
        if os.path.exists(local_path):
            try:
                os.remove(local_path)
            except Exception as cleanup_err:
                print(f"[detection_service] Cleanup warning: {cleanup_err}")
