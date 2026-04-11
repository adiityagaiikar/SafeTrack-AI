from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
from app.core.config import settings

# Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin initialized successfully.")
except Exception as e:
    print(f"Failed to initialize Firebase Admin: {e}")
    # Application will still start but Firebase operations will fail

app = FastAPI(
    title="AI-Based Video Accident Detection API",
    description="Backend API for processing videos for accident detection and reporting."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Error Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception: {exc}")
    # Return 500 for unhandled exceptions
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

# Basic Health Check
@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running successfully!"}

# Include routers
from app.routes import video, user, report
app.include_router(video.router, prefix="/api/video", tags=["Video"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(report.router, prefix="/api/report", tags=["Report"])