from fastapi import APIRouter
from pydantic import BaseModel
import asyncio
import numpy as np

router = APIRouter()

# ── Mock driver telemetry dataset ─────────────────────────────────────────────
# Each row: [avg_speed_kmh, hard_brake_events, tailgating_time_s]
_DRIVER_DATA = [
    {"id": "DRV-001", "avg_speed": 42, "hard_brakes": 1, "tailgating_s": 5},
    {"id": "DRV-002", "avg_speed": 95, "hard_brakes": 9, "tailgating_s": 120},
    {"id": "DRV-003", "avg_speed": 38, "hard_brakes": 0, "tailgating_s": 2},
    {"id": "DRV-004", "avg_speed": 110, "hard_brakes": 14, "tailgating_s": 200},
    {"id": "DRV-005", "avg_speed": 55, "hard_brakes": 3, "tailgating_s": 30},
    {"id": "DRV-006", "avg_speed": 88, "hard_brakes": 7, "tailgating_s": 90},
    {"id": "DRV-007", "avg_speed": 35, "hard_brakes": 0, "tailgating_s": 1},
    {"id": "DRV-008", "avg_speed": 72, "hard_brakes": 5, "tailgating_s": 60},
    {"id": "DRV-009", "avg_speed": 130, "hard_brakes": 18, "tailgating_s": 300},
    {"id": "DRV-010", "avg_speed": 45, "hard_brakes": 2, "tailgating_s": 10},
    {"id": "DRV-011", "avg_speed": 60, "hard_brakes": 4, "tailgating_s": 45},
    {"id": "DRV-012", "avg_speed": 105, "hard_brakes": 12, "tailgating_s": 180},
]

_CLUSTER_LABELS = ["Defensive", "Erratic", "Aggressive"]
_CLUSTER_COLORS = {"Defensive": "#22c55e", "Erratic": "#f97316", "Aggressive": "#ef4444"}


def _label_cluster(centroid_idx: int, centroids: np.ndarray) -> str:
    """Map cluster index to a human label by ranking centroids on composite risk."""
    risk_scores = centroids[:, 0] * 0.4 + centroids[:, 1] * 3 + centroids[:, 2] * 0.05
    order = np.argsort(risk_scores)          # ascending: 0=safest, 2=riskiest
    rank = int(np.where(order == centroid_idx)[0][0])
    return _CLUSTER_LABELS[rank]


@router.get("/fleet/segmentation")
def fleet_segmentation():
    """K-Means driver risk segmentation (n_clusters=3)."""
    try:
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import StandardScaler

        X = np.array([[d["avg_speed"], d["hard_brakes"], d["tailgating_s"]] for d in _DRIVER_DATA])
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        km = KMeans(n_clusters=3, random_state=42, n_init=10)
        km.fit(X_scaled)

        centroids_original = scaler.inverse_transform(km.cluster_centers_)

        drivers = []
        for i, driver in enumerate(_DRIVER_DATA):
            cluster_idx = int(km.labels_[i])
            label = _label_cluster(cluster_idx, centroids_original)
            drivers.append({
                "id":          driver["id"],
                "avg_speed":   driver["avg_speed"],
                "hard_brakes": driver["hard_brakes"],
                "tailgating_s": driver["tailgating_s"],
                "cluster":     cluster_idx,
                "risk_label":  label,
                "color":       _CLUSTER_COLORS[label],
            })

        centroids_out = []
        for idx, c in enumerate(centroids_original):
            label = _label_cluster(idx, centroids_original)
            centroids_out.append({
                "cluster":     idx,
                "risk_label":  label,
                "avg_speed":   round(float(c[0]), 1),
                "hard_brakes": round(float(c[1]), 1),
                "tailgating_s": round(float(c[2]), 1),
                "color":       _CLUSTER_COLORS[label],
            })

        distribution = {}
        for d in drivers:
            distribution[d["risk_label"]] = distribution.get(d["risk_label"], 0) + 1

        return {"drivers": drivers, "centroids": centroids_out, "distribution": distribution}

    except ImportError:
        return {"error": "scikit-learn not installed. Run: pip install scikit-learn"}
    except Exception as e:
        return {"error": str(e)}


# ── Narrative generation ───────────────────────────────────────────────────────

class TelemetryEvent(BaseModel):
    time: int | float          # seconds relative to impact (negative = before)
    speed: int | float         # km/h
    distance: int | float      # metres to nearest object
    event: str | None = None   # e.g. "impact", "hard_brake"


class NarrativeRequest(BaseModel):
    events: list[TelemetryEvent]
    incident_id: str | None = None


def _build_narrative(events: list[TelemetryEvent]) -> str:
    """
    Deterministic NLP template engine — no external LLM dependency.
    Produces a formal legal-style paragraph from raw telemetry events.
    """
    if not events:
        return "Insufficient telemetry data to reconstruct the incident timeline."

    sorted_events = sorted(events, key=lambda e: e.time)
    sentences = []

    for ev in sorted_events:
        t = ev.time
        t_label = f"T{'+' if t >= 0 else ''}{int(t)}s"
        speed_str = f"{ev.speed:.0f} km/h"
        dist_str  = f"{ev.distance:.1f} m" if ev.distance > 0 else "an unresolvable distance"

        if ev.event == "impact":
            sentences.append(
                f"At {t_label}, a critical impact event was recorded. "
                f"Vehicle velocity at point of contact was {speed_str} with a following distance of {dist_str}."
            )
        elif ev.event == "hard_brake":
            sentences.append(
                f"At {t_label}, an emergency braking manoeuvre was detected. "
                f"Speed registered at {speed_str}; proximity to lead object was {dist_str}."
            )
        elif ev.speed > 80:
            sentences.append(
                f"At {t_label}, the vehicle was operating at elevated speed ({speed_str}) "
                f"with a spatial gap of {dist_str} to the nearest detected object."
            )
        else:
            sentences.append(
                f"At {t_label}, the vehicle was travelling at {speed_str} "
                f"maintaining a following distance of {dist_str}."
            )

    # Closing legal clause
    sentences.append(
        "This reconstruction is generated from onboard spatial telemetry and YOLOv8 detection data. "
        "It is intended for insurance and legal review purposes only."
    )

    return " ".join(sentences)


@router.post("/generate-narrative")
async def generate_narrative(body: NarrativeRequest):
    """Async LLM-style incident narrative from spatial telemetry."""
    try:
        # Run CPU-bound generation in a thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        narrative = await loop.run_in_executor(None, _build_narrative, body.events)
        return {
            "incident_id": body.incident_id or "N/A",
            "narrative":   narrative,
            "event_count": len(body.events),
        }
    except Exception as e:
        return {"error": str(e), "narrative": "Narrative generation failed."}
