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
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        Analyze the following accident data and provide a professional incident report.
        Data: {json.dumps(accident_data)}
        
        You MUST return ONLY a valid JSON object with the following keys:
        - summary: A clear concise summary of the accident.
        - cause: The likely cause based on the data.
        - recommendation: Recommended safety or emergency actions.
        - insurance_note: A note for insurance claim purposes.
        """
        
        response = model.generate_content(prompt)
        text = response.text
        
        # Cleanup potential markdown json wrappings from LLM
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text.strip())
        
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return _fallback_report(str(e))

def _fallback_report(error_msg: str) -> dict:
    """Fallback JSON when Gemini API fails."""
    return {
        "summary": "Accident details were recorded but detailed analysis is unavailable due to an AI service error.",
        "cause": "Unknown",
        "recommendation": "Please review the raw footage manually.",
        "insurance_note": f"Service Error: {error_msg}"
    }
