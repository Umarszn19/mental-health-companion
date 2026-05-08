from fastapi import HTTPException
from huggingface_hub import AsyncInferenceClient
from huggingface_hub.errors import HfHubHTTPError

from ..settings import HF_API_TOKEN, HF_MODEL_ID

EMOTION_LABEL_MAP = {
    "joy": "joy",
    "happy": "joy",
    "happiness": "joy",
    "neutral": "neutral",
    "sad": "sadness",
    "sadness": "sadness",
    "fear": "fear",
    "anxiety": "fear",
    "anxious": "fear",
    "anger": "anger",
    "angry": "anger",
    "surprise": "surprise",
    "disgust": "disgust",
}


def normalize_emotion(label: str | None) -> str:
    return EMOTION_LABEL_MAP.get(str(label or "").strip().lower(), "neutral")


def _hf_401_message() -> str:
    return (
        "Hugging Face returned 401. Check HF_API_TOKEN in backend/.env (huggingface.co/settings/tokens) "
        "and restart Uvicorn."
    )


async def classify_emotion_with_hf(text: str) -> tuple[str, float]:
    if not HF_API_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="HF_API_TOKEN is not configured on backend.",
        )

    client = AsyncInferenceClient(model=HF_MODEL_ID, token=HF_API_TOKEN)
    try:
        outputs = await client.text_classification(text)
    except HfHubHTTPError as exc:
        code = getattr(exc.response, "status_code", None)
        if code == 401:
            raise HTTPException(status_code=502, detail=_hf_401_message()) from exc
        raise HTTPException(
            status_code=502,
            detail=f"Hugging Face inference failed ({code}): {exc}",
        ) from exc
    except Exception as exc:
        msg = str(exc)
        if "401" in msg or "Unauthorized" in msg:
            raise HTTPException(status_code=502, detail=_hf_401_message()) from exc
        raise HTTPException(
            status_code=502,
            detail=f"Hugging Face inference failed: {exc}",
        ) from exc

    if not outputs:
        return "neutral", 0.5

    top = max(outputs, key=lambda row: float(row.score))
    emotion = normalize_emotion(str(top.label))
    confidence = float(top.score)
    return emotion, confidence
