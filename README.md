# AI-Based Video Accident Detection and Emergency Response System

This is a Full-Stack application designed to detect road accidents from videos using a YOLO-based AI model and trigger emergency response workflows.

## Technology Stack

- **Frontend:** React + Vite, Firebase Auth, Tailwind CSS
- **Backend:** FastAPI (Python), Firebase Admin SDK, Cloudinary, Google GenAI (Gemini)
- **AI/ML:** YOLO (Ultralytics), OpenCV
- **Database:** Firebase Firestore

---

## Setup Instructions

### 1. Prerequisites
- Python 3.9+
- Node.js 18+
- Firebase Project with Authentication (Email/Password) and Firestore enabled.
- Cloudinary Account
- Google Gemini API Key

### 2. Environment Variables Setup

**Backend (`backend/.env`):**
Create the file and configure:
```env
# Path to your Firebase Admin SDK Private Key JSON file
FIREBASE_CREDENTIALS_PATH=firebase-key.json

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Twilio Credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TARGET_PHONE_NUMBER=target_emergency_phone_number

# Razorpay Credentials (Optional)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
PAYMENT_VERIFICATION_SECRET=your_payment_verification_secret
```

**Frontend (`frontend/road-safety-ui/.env`):**
Create the file and configure:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_unsigned
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Initialization
1. In your Firebase Console, navigate to **Project Settings** > **Service Accounts**.
2. Click **Generate new private key** and save the downloaded JSON file as `backend/firebase-key.json`.
3. Ensure you have activated **Authentication** (Email/Password enabled) and initialized the **Firestore Database**.

---

## How to Run

### Backend (FastAPI)
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend will be available at [http://localhost:8000](http://localhost:8000). You can visit `/docs` for Swagger API Documentation.

### Frontend (React + Vite)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend/road-safety-ui
   ```
2. Install npm dependencies:
   ```bash
   npm install
   npm install firebase
   ```
3. Run the Vite development server:
   ```bash
   20
   ```
   The frontend will be available at the displayed localhost URL (usually [http://localhost:5173](http://localhost:5173)).

---

## Architecture Flow
1. **Upload:** User hits the upload page and posts a video. Video gets securely uploaded to **Cloudinary** using standard unsigned presets.
2. **Detection Processing:** Frontend securely sends Cloudinary video link to FastAPI Backend (`POST /api/video/detect`) attached with the Firebase JWT token in the headers.
3. **Execution:** Backend fetches user role via Firebase Admin. It then locally streams down the video, runs the Ultralytics YOLO inference model wrapper, records the metrics into Firestore, and cleans up the temporary traces.
4. **Summary / Dashboard:** Any generated incident can be analyzed using `POST /api/report/generate-report` bridging to Google Gemini rendering formatted Markdown intelligence. Authority levels view metrics via Frontend Firebase endpoints.
