import os
import json
import logging
from typing import Dict, Any

from google import genai
from groq import Groq

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

class LLMError(Exception):
    pass

# Initialize clients lazily if needed, but we check env in generate_json
# to ensure load_dotenv was called in main.py first.

def get_gemini_client():
    if os.getenv("GEMINI_API_KEY"):
        # We need to configure the client properly, checking google-genai docs
        # The prompt says `google-genai client`
        return genai.Client()
    return None

def get_groq_client():
    if os.getenv("GROQ_API_KEY"):
        return Groq()
    return None

def generate_json(system: str, user: str, temperature: float = 0.4) -> Dict[str, Any]:
    gemini_client = get_gemini_client()
    groq_client = get_groq_client()

    if not gemini_client and not groq_client:
        raise LLMError("No LLM clients configured. Check API keys.")

    exception = None

    if gemini_client:
        try:
            model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
            response = gemini_client.models.generate_content(
                model=model,
                contents=user,
                config={
                    "system_instruction": system,
                    "response_mime_type": "application/json",
                    "temperature": temperature,
                }
            )
            raw = response.text
            if not raw:
                raise Exception("Empty response from Gemini")
            # Strip fences
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            elif raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
            result = json.loads(raw)
            logger.info("Answered by Gemini")
            return result
        except Exception as e:
            logger.warning(f"Gemini failed: {e}")
            exception = e

    if groq_client:
        try:
            model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
            completion = groq_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user}
                ],
                temperature=temperature,
                response_format={"type": "json_object"}
            )
            raw = completion.choices[0].message.content
            if not raw:
                raise Exception("Empty response from Groq")
            raw = raw.strip()
            if raw.startswith("```json"):
                raw = raw[7:]
            elif raw.startswith("```"):
                raw = raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
            result = json.loads(raw)
            logger.info("Answered by Groq")
            return result
        except Exception as e:
            logger.warning(f"Groq failed: {e}")
            exception = e
            
    raise LLMError(f"All LLM providers failed. Last exception: {exception}")
