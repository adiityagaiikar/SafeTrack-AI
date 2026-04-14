from fastapi import APIRouter, Depends
from pydantic import BaseModel
from firebase_admin import firestore
from typing import Optional

from app.services.firebase_service import get_current_user, get_firestore_client
from app.services.twilio_service import dispatch_emergency_sos

router = APIRouter()


class SOSDispatchRequest(BaseModel):
    userId: Optional[str] = None
    incident_id: Optional[str] = None
    coordinates: Optional[dict] = None
    severity: str
    cloudinaryVideoUrl: Optional[str] = None
    target_phone_numbers: list[str] = []


@router.post("/dispatch")
async def dispatch_sos(request: SOSDispatchRequest, user: dict = Depends(get_current_user)):
    db = get_firestore_client()

    payload = {
        "userId": user["uid"],
        "requestedUserId": request.userId,
        "incident_id": request.incident_id,
        "severity": request.severity,
        "coordinates": request.coordinates,
        "cloudinaryVideoUrl": request.cloudinaryVideoUrl,
        "status": "dispatched",
        "timestamp": firestore.SERVER_TIMESTAMP,
    }

    sos_ref = db.collection("sos_dispatches").document()
    sos_ref.set(payload)

    message = (
        f"SOS ALERT: Potential severe crash detected for user {user.get('email', user['uid'])}. "
        f"Severity: {request.severity}. "
        f"Location: {request.coordinates if request.coordinates else 'Unavailable'}."
    )

    twilio_result = dispatch_emergency_sos(request.target_phone_numbers, message)

    return {
        "message": "SOS dispatch created",
        "dispatchId": sos_ref.id,
        "contactsNotified": twilio_result.get("sent", 0),
        "dispatchMeta": twilio_result,
    }
