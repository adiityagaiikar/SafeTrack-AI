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

import smtplib
from email.mime.text import MIMEText

def send_emergency_email(to_email: str, message: str) -> None:
    """
    Sends emergency alerts via email (equivalent to nodemailer).
    Requires EMAIL_USER and EMAIL_PASS to be set in the .env file.
    """
    if not to_email:
        print("No destination email provided.")
        return

    email_user = settings.EMAIL_USER
    email_pass = settings.EMAIL_PASS

    if not email_user or not email_pass:
        print(f"Email credentials missing. Simulate Email to {to_email}:")
        print(f"[Email Subject: 🚨 EMERGENCY ALERT]\n{message}")
        return

    try:
        msg = MIMEText(message)
        msg['Subject'] = '🚨 EMERGENCY ALERT - Road Safety AI'
        msg['From'] = email_user
        msg['To'] = to_email

        # Using Gmail's SMTP server as default (update if using another provider)
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(email_user, email_pass)
        server.send_message(msg)
        server.quit()
        print(f"=== EMERGENCY EMAIL DISPATCHED to {to_email} ===")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
