from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

import razorpay

from app.core.config import settings
from app.services.firebase_service import get_firestore_client
from app.services.firebase_service import get_current_user

router = APIRouter()


class CreateOrderRequest(BaseModel):
    plan_type: str
    email: Optional[str] = None
    contact: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    plan_type: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


PLAN_PRICES = {
    "Pro": 1500,
    "Enterprise": 5000,
}


@router.post("/create-order")
async def create_order(request: CreateOrderRequest, user: dict = Depends(get_current_user)):
    if request.plan_type not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay is not configured on the backend")

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    amount_in_paise = PLAN_PRICES[request.plan_type] * 100

    try:
        order = client.order.create(
            {
                "amount": amount_in_paise,
                "currency": "INR",
                "payment_capture": 1,
                "receipt": f"{request.plan_type.lower()}_{user['uid']}",
                "notes": {
                    "plan_type": request.plan_type,
                    "user_uid": user["uid"],
                    "email": request.email or user.get("email", ""),
                },
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create Razorpay order: {exc}")

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "plan_type": request.plan_type,
        "key_id": settings.RAZORPAY_KEY_ID,
    }


@router.post("/verify")
async def verify_payment(request: VerifyPaymentRequest, user: dict = Depends(get_current_user)):
    if request.plan_type not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay is not configured on the backend")

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": request.razorpay_order_id,
                "razorpay_payment_id": request.razorpay_payment_id,
                "razorpay_signature": request.razorpay_signature,
            }
        )
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature")

    db = get_firestore_client()
    user_ref = db.collection("users").document(user["uid"])
    user_ref.set(
        {
            "subscription_plan": request.plan_type,
            "subscription_status": "active",
            "last_payment_id": request.razorpay_payment_id,
            "last_order_id": request.razorpay_order_id,
        },
        merge=True,
    )

    return {
        "message": "Payment verified and subscription updated",
        "plan_type": request.plan_type,
        "payment_id": request.razorpay_payment_id,
    }