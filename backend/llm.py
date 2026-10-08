import os
import json
import logging
import time
from typing import Dict, Any

from google import genai
from groq import Groq

logger = logging.getLogger(__name__)

class LLMError(Exception):
    pass

def get_gemini_client():
    if os.getenv("GEMINI_API_KEY"):
        return genai.Client(http_options={'timeout': 45.0})
    return None

def get_groq_client():
    if os.getenv("GROQ_API_KEY"):
        return Groq(timeout=45.0)
    return None

def _parse_json(raw: str) -> Dict[str, Any]:
    raw = raw.strip()
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()
    return json.loads(raw)

def _call_gemini(client, model, system, user, temperature, retries=1):
    last_exception = None
    for attempt in range(retries + 1):
        try:
            response = client.models.generate_content(
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
                raise ValueError("Empty response from Gemini")
            return raw
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "500" in err_str or "502" in err_str or "503" in err_str or "504" in err_str or "timeout" in err_str:
                if attempt < retries:
                    logger.warning(f"Gemini network error ({model}): {e}. Retrying in 2 seconds...")
                    time.sleep(2)
                    last_exception = e
                    continue
            raise e
    raise last_exception

def _call_groq(client, model, system, user, temperature):
    completion = client.chat.completions.create(
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
        raise ValueError("Empty response from Groq")
    return raw

def generate_json(system: str, user: str, temperature: float = 0.4) -> Dict[str, Any]:
    gemini_client = get_gemini_client()
    groq_client = get_groq_client()

    llm_order = os.getenv("LLM_ORDER", "groq,gemini").split(",")
    providers = []
    for p in llm_order:
        p = p.strip().lower()
        if p == "gemini" and gemini_client:
            providers.append("gemini")
        elif p == "groq" and groq_client:
            providers.append("groq")

    if not providers:
        raise LLMError("No LLM clients configured. Check API keys.")

    last_exception = None

    for provider in providers:
        if provider == "gemini":
            model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
            provider_system = system
            for json_attempt in range(2):
                try:
                    raw = _call_gemini(gemini_client, model, provider_system, user, temperature)
                    result = _parse_json(raw)
                    logger.info(f"Answered by Gemini ({model})")
                    return result
                except json.JSONDecodeError as e:
                    if json_attempt == 0:
                        logger.warning(f"Gemini returned invalid JSON: {e}. Retrying with strict JSON prompt.")
                        provider_system += "\nReturn ONLY valid JSON."
                        continue
                    else:
                        logger.exception(f"Gemini failed JSON parsing ({model}): {e}")
                        last_exception = e
                        break
                except Exception as e:
                    logger.exception(f"Gemini failed ({model}): {e}")
                    last_exception = e
                    break
                    
        elif provider == "groq":
            model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
            provider_system = system
            for json_attempt in range(2):
                try:
                    raw = _call_groq(groq_client, model, provider_system, user, temperature)
                    result = _parse_json(raw)
                    logger.info(f"Answered by Groq ({model})")
                    return result
                except json.JSONDecodeError as e:
                    if json_attempt == 0:
                        logger.warning(f"Groq returned invalid JSON: {e}. Retrying with strict JSON prompt.")
                        provider_system += "\nReturn ONLY valid JSON."
                        continue
                    else:
                        logger.exception(f"Groq failed JSON parsing ({model}): {e}")
                        last_exception = e
                        break
                except Exception as e:
                    logger.exception(f"Groq failed ({model}): {e}")
                    last_exception = e
                    break

    raise LLMError(f"All LLM providers failed. Last exception: {last_exception}")
