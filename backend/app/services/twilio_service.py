from typing import List

try:
    from twilio.rest import Client
except Exception:
    Client = None

from app.core.config import settings


def dispatch_emergency_sos(target_phone_numbers: List[str], message: str) -> dict:
    if not target_phone_numbers:
        return {"sent": 0, "skipped": True, "reason": "No emergency contacts provided"}

    if Client is None:
        return {"sent": 0, "skipped": True, "reason": "Twilio package is not installed"}

    from_number = settings.TWILIO_FROM_NUMBER or settings.TWILIO_PHONE_NUMBER or settings.TARGET_PHONE_NUMBER

    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not from_number:
        return {"sent": 0, "skipped": True, "reason": "Twilio credentials are not configured"}

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    sent = 0
    failures = []

    for phone_number in target_phone_numbers:
        try:
            msg = client.messages.create(
                body=message,
                from_=settings.TWILIO_FROM_NUMBER,
                to=phone_number,
            )
            print(f"[Twilio] SMS sent successfully. SID: {msg.sid} | From: {settings.TWILIO_FROM_NUMBER} | To: {phone_number}")
            sent += 1
        except Exception as exc:
            print(f"[Twilio] Failed to send to {phone_number}: {exc}")
            failures.append({"phone": phone_number, "error": str(exc)})

    return {"sent": sent, "skipped": False, "failures": failures}
