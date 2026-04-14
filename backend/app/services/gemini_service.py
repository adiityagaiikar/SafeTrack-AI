try:
    import google.generativeai as genai
except Exception:
    genai = None
import json
from app.core.config import settings

def generate_accident_report_json(accident_data: dict) -> dict:
    """
    Calls Google GenAI API to generate a structured JSON report.
    """
    if genai is None:
        return _fallback_report("google-generativeai package is not installed.")

    if not settings.GEMINI_API_KEY:
        return _fallback_report("Gemini API key is missing.")

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        
        prompt = f"""
        Analyze the following accident details/metadata and generate a highly detailed, professional Motor Vehicle Accident Incident Investigation Report.
        Data: {json.dumps(accident_data)}
        
        You MUST return ONLY a valid JSON object matching this EXACT structure. Use dummy data for driver names, car numbers, licenses, ages, etc. But make the severity, cause, weather, and risks logically consistent with the accident data provided.

        {{
            "report_identification": {{
                "report_number": "ERS-2024-MH-00847",
                "date_of_report": "14 April 2024",
                "time_of_incident": "13:22 IST",
                "date_of_incident": "14 April 2024 (Monday)",
                "reported_by": "ERS Auto-Dispatch System",
                "report_prepared_by": "AI Agent",
                "report_status": "FINAL - Approved",
                "jurisdiction": "Mumbai, Maharashtra",
                "severity": "HIGH",
                "incident_status": "CLOSED"
            }},
            "incident_location": {{
                "gps_coordinates": "19.1136 N, 72.8697 E",
                "street_address": "Western Express Highway",
                "landmark": "100 m north of Metro Station",
                "city_district": "Andheri East",
                "state": "Maharashtra",
                "road_type": "National Highway",
                "road_condition": "Wet",
                "lighting_condition": "Daylight - Overcast",
                "speed_limit_zone": "60 km/h",
                "scene_secured_by": "Police Station"
            }},
            "parties_involved": [
                {{
                    "role": "Vehicle 1 (Primary - At Fault)",
                    "driver_name": "Ramesh Kumar Gupta",
                    "age_gender": "34 Years / Male",
                    "dl_number": "MH04-20180034567 (Valid)",
                    "contact": "+91-98XXXXXXXX",
                    "vehicle_no": "MH 04 EZ 7823",
                    "vehicle_type": "Sedan (2021)",
                    "insurance_policy": "Valid till 31-Mar-2025",
                    "injuries": "Minor - Laceration",
                    "action_taken": "FIR Filed"
                }},
                {{
                    "role": "Vehicle 2 (Secondary - Victim)",
                    "driver_name": "Sunita Prashant Nair",
                    "age_gender": "28 Years / Female",
                    "dl_number": "MH04-20210056123 (Valid)",
                    "contact": "+91-98XXXXXXXX",
                    "vehicle_no": "MH 04 GH 1104",
                    "vehicle_type": "Hatchback (2022)",
                    "insurance_policy": "Valid till 15-Sep-2024",
                    "injuries": "MODERATE - Suspected whiplash",
                    "action_taken": "Victim statement recorded"
                }}
            ],
            "cause_of_accident": {{
                "primary_cause": "Rear-end collision due to tailgating and excessive speed",
                "cause_category": "Driver Error",
                "estimated_impact_speed": "72 km/h",
                "evasive_action_taken": "None detected",
                "contributing_factors": [
                    "Wet road surface reducing effective braking distance",
                    "Overcast visibility causing delayed perception"
                ],
                "environmental_factors": {{
                    "weather": "Light rain - visibility approx. 400 m",
                    "road_surface": "Wet asphalt",
                    "traffic_volume": "High - Rush-hour conditions",
                    "signal_signage": "No active signal at point of impact",
                    "cctv_coverage": "Captured by Camera ID"
                }}
            }},
            "risk_analysis": [
                {{
                    "risk_factor": "Wet road surface",
                    "likelihood": "HIGH",
                    "recommended_mitigation": "Warning signage"
                }},
                {{
                    "risk_factor": "Driver distraction",
                    "likelihood": "HIGH",
                    "recommended_mitigation": "Enforcement cameras"
                }}
            ],
            "summary": "Rear-end collision due to tailgating and excessive speed."
        }}
        """
        
        response = model.generate_content(prompt)
        text = response.text
        
        # Cleanup potential markdown json wrappings from LLM
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        if text.startswith("```"):
            text = text[3:]
            
        return json.loads(text.strip())
        
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return _fallback_report(str(e))

def _fallback_report(error_msg: str) -> dict:
    """Fallback JSON structure when Gemini API fails, matching expected PDF schema."""
    return {
        "report_identification": {
            "report_number": "ERROR-AI-SERVICE",
            "date_of_report": "Error State",
            "report_status": "FAILED",
            "severity": "UNKNOWN"
        },
        "incident_location": {
            "error": "Detailed AI analysis failed.",
            "message": error_msg
        },
        "parties_involved": [],
        "cause_of_accident": {
            "primary_cause": "AI Analysis Error",
            "contributing_factors": [error_msg]
        },
        "risk_analysis": [],
        "summary": f"AI service error: {error_msg}. Manual review required."
    }
