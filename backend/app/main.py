from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import AnalyzeRequest, AnalyzeResponse
from .services.emotion_service import classify_emotion_with_hf
from .services.reply_service import compose_reply
from .settings import HF_API_TOKEN, HF_MODEL_ID, parse_cors_origins

app = FastAPI(title="Open Room API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "hf_configured": bool(HF_API_TOKEN),
        "hf_token_starts_with_hf": HF_API_TOKEN.startswith("hf_"),
        "model_id": HF_MODEL_ID,
    }


@app.post("/analyse", response_model=AnalyzeResponse)
@app.post("/analyze", response_model=AnalyzeResponse, include_in_schema=False)
async def analyse(payload: AnalyzeRequest) -> AnalyzeResponse:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    recent = [x.strip() for x in payload.recent_user_messages if x and x.strip()][-8:]

    emotion, confidence = await classify_emotion_with_hf(text)
    reply = compose_reply(emotion, text, recent, confidence)

    return AnalyzeResponse(
        reply=reply,
        emotion=emotion,
        confidence=round(confidence, 4),
        source="backend",
    )
