from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.services.firebase_service import get_firestore_client, get_current_user

router = APIRouter()


class ContactsUpdateRequest(BaseModel):
    contacts: list[str]

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


@router.put("/contacts")
async def update_contacts(request: ContactsUpdateRequest, user: dict = Depends(get_current_user)):
    cleaned = [value.strip() for value in request.contacts if value and value.strip()]

    if len(cleaned) > 3:
        raise HTTPException(status_code=400, detail="You can store up to 3 emergency contacts only")

    db = get_firestore_client()
    user_ref = db.collection("users").document(user["uid"])
    user_ref.set({"contacts": cleaned}, merge=True)

    return {"message": "Contacts updated successfully", "contacts": cleaned}
