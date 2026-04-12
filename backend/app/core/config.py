import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-key.json")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    PAYMENT_VERIFICATION_SECRET: str = os.getenv("PAYMENT_VERIFICATION_SECRET", "")
    
    # These names now perfectly match your .env file!
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "")
    TARGET_PHONE_NUMBER: str = os.getenv("TARGET_PHONE_NUMBER", "")
    TWILIO_FROM_NUMBER: str = os.getenv(
        "TWILIO_FROM_NUMBER",
        os.getenv("TWILIO_PHONE_NUMBER", os.getenv("TARGET_PHONE_NUMBER", "")),
    )

    class Config:
        env_file = ".env"

settings = Settings()