from fastapi.testclient import TestClient

from app.main import app
import app.main as main_module


client = TestClient(app)


def test_health_returns_status_payload():
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "hf_configured" in data
    assert "hf_token_starts_with_hf" in data
    assert "model_id" in data


def test_analyse_rejects_whitespace_only_text():
    response = client.post("/analyse", json={"text": "   ", "recent_user_messages": []})

    assert response.status_code == 400
    assert response.json()["detail"] == "Text cannot be empty."


def test_analyse_returns_structured_response(monkeypatch):
    async def fake_classify(_text: str):
        return "joy", 0.81234

    def fake_compose(emotion: str, text: str, recent_user: list[str], model_confidence: float = 1.0):
        return f"reply::{emotion}::{round(model_confidence, 4)}::{len(recent_user)}::{text}"

    monkeypatch.setattr(main_module, "classify_emotion_with_hf", fake_classify)
    monkeypatch.setattr(main_module, "compose_reply", fake_compose)

    payload = {
        "text": "I had a better day today.",
        "recent_user_messages": ["a", "  ", "b", "", "c"],
    }
    response = client.post("/analyse", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "backend"
    assert data["emotion"] == "joy"
    # Rounded in endpoint before returning response.
    assert data["confidence"] == 0.8123
    assert data["reply"].startswith("reply::joy::0.8123::3::")


def test_analyze_alias_still_supported():
    response = client.post("/analyze", json={"text": "hello", "recent_user_messages": []})

    # Route alias exists (response code may vary by external HF config).
    assert response.status_code != 404
