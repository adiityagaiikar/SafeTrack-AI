from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.firebase_service import get_current_user, get_firestore_client
from app.services.gemini_service import generate_accident_report_json

router = APIRouter()

class ReportRequest(BaseModel):
    accident_id: str

@router.post("/generate-report")
async def generate_report(request: ReportRequest, user: dict = Depends(get_current_user)):
    db = get_firestore_client()
    doc = db.collection("accidents").document(request.accident_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Accident record not found")
        
    accident_data = doc.to_dict()
    
    # Ensure users can only generate reports for their own accidents or if they are authority
    if user["role"] != "authority" and accident_data.get("userId") != user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this record")
        
    report = generate_accident_report_json(accident_data)
    return report
