from fastapi import APIRouter, Depends
from app.services.firebase_service import get_firestore_client, get_current_user

router = APIRouter()

@router.get("/contacts")
async def get_contacts(user: dict = Depends(get_current_user)):
    db = get_firestore_client()
    user_doc = db.collection("users").document(user["uid"]).get()
    
    if user_doc.exists:
        return {"contacts": user_doc.to_dict().get("contacts", [])}
    return {"contacts": []}

@router.post("/contacts")
async def add_contact(contact: str, user: dict = Depends(get_current_user)):
    db = get_firestore_client()
    user_ref = db.collection("users").document(user["uid"])
    
    # We use arrayUnion to append contact
    from google.cloud.firestore import ArrayUnion
    user_ref.set({"contacts": ArrayUnion([contact])}, merge=True)
    
    return {"message": f"Added {contact}"}
