from twilio.rest import Client
from app.core.config import settings

def send_emergency_alert(contacts: list, message: str) -> None:
    """
    Sends emergency alerts via SMS using Twilio.
    """
    if not contacts:
        print("No contacts to alert.")
        return

    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_PHONE_NUMBER:
        print("Twilio credentials missing. Simulate SMS:")
        for phone in contacts:
            print(f"[SMS to {phone}]: {message}")
        return

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        print("=== EMERGENCY SMS ALERT TRIGGERED ===")
        for phone in contacts:
            try:
                sms = client.messages.create(
                    body=message,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=phone
                )
                print(f"[SMS dispatched to {phone}]: SID {sms.sid}")
            except Exception as e:
                print(f"Failed to send SMS to {phone}: {e}")
        print("=====================================")
    except Exception as e:
        print(f"Failed to initialize Twilio Client: {e}")
