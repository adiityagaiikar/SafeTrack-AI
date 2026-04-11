from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth, firestore

security = HTTPBearer()

def get_firestore_client():
    if not firebase_admin._apps:
        # Dummy or placeholder return if Firebase is not yet initialized
        raise HTTPException(
            status_code=500, detail="Firebase Admin not initialized"
        )
    return firestore.client()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Middleware to verify Firebase ID tokens.
    Returns the decoded token or raises 401.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )

    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}"
        )

async def get_current_user(decoded_token: dict = Depends(verify_token)):
    """
    Dependency equivalent to current user. Also fetches user role from Firestore.
    """
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing uid"
        )

    db = get_firestore_client()
    user_doc_ref = db.collection("users").document(uid)
    user_doc = user_doc_ref.get()

    role = "user"
    if user_doc.exists:
        role = user_doc.to_dict().get("role", "user")
    else:
        # Create user document if it doesn't exist yet
        user_doc_ref.set({
            "role": "user",
            "contacts": []
        }, merge=True)

    return {"uid": uid, "email": decoded_token.get("email"), "role": role}

async def require_authority(user: dict = Depends(get_current_user)):
    """
    RBAC dependency ensuring user has authority role
    """
    if user.get("role") != "authority":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Requires authority role."
        )
    return user
