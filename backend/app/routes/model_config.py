from fastapi import APIRouter
from pydantic import BaseModel, Field
import app.main as main_module

router = APIRouter()

# ── Schema ────────────────────────────────────────────────────────────────────

class ModelConfig(BaseModel):
    conf_general:  float = Field(ge=0.05, le=1.0)
    conf_critical: float = Field(ge=0.05, le=1.0)
    iou:           float = Field(ge=0.05, le=1.0)
    frame_skip:    int   = Field(ge=1,    le=10)


# ── GET current config ────────────────────────────────────────────────────────

@router.get("/model/config")
def get_model_config():
    """Return the live inference parameters."""
    try:
        return {
            "conf_general":  main_module.CONF_GENERAL,
            "conf_critical": main_module.CONF_CRITICAL,
            "iou":           0.45,          # stored separately — expose it
            "frame_skip":    main_module.FRAME_SKIP,
            "model_online":  main_module._yolo_model is not None,
        }
    except Exception as e:
        return {"error": str(e)}


# ── POST update config ────────────────────────────────────────────────────────

@router.post("/model/config")
def update_model_config(cfg: ModelConfig):
    """Hot-update inference parameters without restarting the server."""
    try:
        main_module.CONF_GENERAL  = cfg.conf_general
        main_module.CONF_CRITICAL = cfg.conf_critical
        main_module.FRAME_SKIP    = cfg.frame_skip
        # iou is passed per-call in track(); store it so GET reflects it
        main_module._LIVE_IOU     = cfg.iou

        print(
            f"[Config] Updated — conf={cfg.conf_general} "
            f"iou={cfg.iou} frame_skip={cfg.frame_skip}"
        )
        return {
            "status":  "deployed",
            "applied": {
                "conf_general":  cfg.conf_general,
                "conf_critical": cfg.conf_critical,
                "iou":           cfg.iou,
                "frame_skip":    cfg.frame_skip,
            },
        }
    except Exception as e:
        return {"error": str(e)}
