import os

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
try:
    from twilio.rest import Client
except Exception:
    Client = None

load_dotenv()

router = APIRouter()


class DispatchSMSRequest(BaseModel):
    incident_id: str
    severity: str
    target_phone_number: str


@router.post("/sms")
async def dispatch_sms(payload: DispatchSMSRequest):
    if Client is None:
        raise HTTPException(status_code=500, detail="Twilio package is not installed")

    twilio_sid = os.getenv("TWILIO_SID") or os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone_number = (
        os.getenv("TWILIO_PHONE_NUMBER")
        or os.getenv("TWILIO_FROM_NUMBER")
        or os.getenv("TARGET_PHONE_NUMBER")
    )

    if not twilio_sid or not twilio_auth_token or not twilio_phone_number:
        raise HTTPException(status_code=500, detail="Twilio environment variables are not configured")

    client = Client(twilio_sid, twilio_auth_token)

    try:
        message = client.messages.create(
            body=f"CRITICAL ALERT: Incident {payload.incident_id} detected. Severity: {payload.severity}. Dispatch immediate response.",
            from_=twilio_phone_number,
            to=payload.target_phone_number,
        )
        return {"status": "success", "message_sid": message.sid}
    except Exception as exc:
        print(f"[Twilio Dispatch Error] {exc}")
        raise HTTPException(status_code=500, detail=f"Twilio dispatch failed: {exc}")
