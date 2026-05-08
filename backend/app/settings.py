import os
from pathlib import Path

from dotenv import load_dotenv


def _clean_env_token(raw: str | None) -> str:
    t = (raw or "").strip()
    if len(t) >= 2 and ((t[0] == t[-1] == '"') or (t[0] == t[-1] == "'")):
        t = t[1:-1].strip()
    return t


def parse_cors_origins() -> list[str]:
    raw = os.getenv("BACKEND_CORS_ORIGINS", "").strip()
    if not raw:
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    return [part.strip() for part in raw.split(",") if part.strip()]


BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

HF_MODEL_ID = os.getenv("HF_MODEL_ID", "j-hartmann/emotion-english-distilroberta-base")
HF_API_TOKEN = _clean_env_token(os.getenv("HF_API_TOKEN", ""))
