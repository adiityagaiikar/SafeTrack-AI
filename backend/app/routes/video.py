from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from app.services.firebase_service import get_current_user, get_firestore_client
from app.services.detection_service import process_video_detection
from app.services.email_service import send_emergency_alert
from firebase_admin import firestore
import uuid

router = APIRouter()

class DetectRequest(BaseModel):
    video_url: HttpUrl

@router.post("/detect")
async def detect_accident_route(request: DetectRequest, user: dict = Depends(get_current_user)):
    if not request.video_url:
        raise HTTPException(status_code=400, detail="video_url is required")
        
    try:
        # 1. Processing the video through the YOLO wrapper
        detection_result = process_video_detection(str(request.video_url))
        
        # 2. Saving to Firestore
        db = get_firestore_client()
        accident_id = str(uuid.uuid4())
        
        accident_data = {
            "userId": user["uid"],
            "videoUrl": str(request.video_url),
            "location": "Unknown",
            "accidentDetected": detection_result.get("accident", False),
            "severity": detection_result.get("severity", "LOW"),
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        db.collection("accidents").document(accident_id).set(accident_data)
        
        # 3. Simulate emergency SMS
        if accident_data["accidentDetected"]:
            user_doc = db.collection("users").document(user["uid"]).get()
            contacts = []
            if user_doc.exists:
                contacts = user_doc.to_dict().get("contacts", [])
            
            message = f"🚨 EMERGENCY: An accident involving {user.get('email', 'a user')} has been detected. Severity: {accident_data['severity']}"
            send_emergency_alert(contacts, message)
            
        return {
            "accident": accident_data["accidentDetected"],
            "severity": accident_data["severity"],
            "message": "Detection processing completed successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
