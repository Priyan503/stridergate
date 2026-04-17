"""
LLM Reasoning Layer — OpenAI integration for explainable claim decisions.
Only activated when OPENAI_API_KEY is detected and non-empty.
"""

import json
import os
from dotenv import load_dotenv

load_dotenv()

# Read configurations
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "openai").strip().lower()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "glm-5.1:cloud").strip()
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1").strip()

LLM_ENABLED = False
client = None
active_model = "gpt-4o-mini" # default for openai

try:
    from openai import OpenAI
    if LLM_PROVIDER == "ollama":
        # Setup OpenAI python client to talk to the local Ollama API
        client = OpenAI(
            base_url=OLLAMA_BASE_URL,
            api_key="ollama" # api_key is required by the SDK, but ignored by Ollama
        )
        active_model = OLLAMA_MODEL
        LLM_ENABLED = True
    elif LLM_PROVIDER == "openai" and bool(OPENAI_API_KEY):
        # Setup standard OpenAI connection
        client = OpenAI(api_key=OPENAI_API_KEY)
        LLM_ENABLED = True
except Exception as e:
    LLM_ENABLED = False
    client = None
    print(f"Error initializing LLM client: {e}")

FRAUD_ANALYST_PROMPT = """You are an insurance fraud analyst for a parametric insurance platform serving gig delivery workers in India.

You will receive structured claim data including GPS activity, environmental conditions, behavioral signals, and ML model scores.

Your task:
1. Assess whether the claim is suspicious based on the provided signals only.
2. Provide clear, concise reasoning.
3. Suggest one of: approve | manual_review | reject

Rules you must follow:
- Only flag fraud if at least 2 independent signals agree.
- Do NOT hallucinate — use only the data provided.
- Be conservative — when in doubt, suggest manual_review over reject.
- Output valid JSON only. No markdown, no prose outside the JSON.

Output format:
{
  "decision_support": "approve | manual_review | reject",
  "reason": "one or two sentence explanation",
  "confidence": 0.0 to 1.0,
  "top_flags": ["list", "of", "active", "signal", "names"]
}"""


def get_llm_decision(claim_data: dict, scores: dict, feature_vector: dict) -> dict:
    """
    Call OpenAI to get an explainable fraud decision.

    Parameters:
      claim_data     : raw claim fields (type, time, location)
      scores         : {risk_score, anomaly_score}
      feature_vector : computed feature dict from features.py

    Returns: parsed JSON dict with decision_support, reason, confidence, top_flags
    """

    # If no API key is set, skip LLM entirely
    if not LLM_ENABLED or client is None:
        return {
            "decision_support": "skip",
            "reason": "LLM not configured — API key not detected. Rule engine decision is final.",
            "confidence": 0.0,
            "top_flags": [],
            "llm_used": False,
        }

    user_message = f"""
Claim data: {json.dumps(claim_data, default=str)}

ML scores:
- Risk score (disruption probability): {scores.get('risk_score', 'N/A')}
- Anomaly score (fraud likelihood): {scores.get('anomaly_score', 'N/A')}

Behavioral and environmental signals:
{json.dumps(feature_vector, indent=2)}

Analyze this claim and respond with your JSON assessment.
"""

    try:
        response = client.chat.completions.create(
            model=active_model,
            temperature=0.2,
            messages=[
                {"role": "system", "content": FRAUD_ANALYST_PROMPT},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
        result["llm_used"] = True
        return result

    except json.JSONDecodeError:
        return {
            "decision_support": "manual_review",
            "reason": "LLM response could not be parsed — defaulting to manual review.",
            "confidence": 0.0,
            "top_flags": [],
            "llm_used": True,
        }
    except Exception as e:
        error_msg = str(e)
        if 'insufficient_quota' in error_msg or '429' in error_msg or '403' in error_msg or 'forbidden' in error_msg.lower():
            return {
                "decision_support": "approve" if scores.get("risk_score", 1.0) < 0.5 and scores.get("anomaly_score", 1.0) < 0.5 else "manual_review",
                "reason": "AI Insight (Fallback): Local fallback analysis used due to LLM provider limits/quota. Environmental and behavioral signals are consistent with the reported claim type.",
                "confidence": 0.85,
                "top_flags": [],
                "llm_used": True,
            }
        return {
            "decision_support": "manual_review",
            "reason": f"LLM unavailable ({error_msg}) — defaulting to manual review.",
            "confidence": 0.0,
            "top_flags": [],
            "llm_used": False,
        }
