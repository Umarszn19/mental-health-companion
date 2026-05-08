# mental-health-companion
Final year project — Open Room: emotion-aware wellbeing chat and mood insights.

## Project Overview

Open Room is a non-clinical mental wellbeing prototype for students and young adults.
It analyses message tone with an emotion detector, returns bounded supportive responses,
and plots mood trends over time from chat-derived signals.

Core goals:
- emotion-aware chat responses
- confidence-aware handling for uncertain inputs
- mood tracking without manual scoring
- clear safety scope and crisis signposting

## Tech Stack

- Frontend: React + Vite
- Backend: FastAPI (Python)
- Inference: Hugging Face Inference API (`j-hartmann/emotion-english-distilroberta-base`)
- Storage (prototype): Browser `localStorage`

## Repository Structure

- `frontend/vite-project/` - React app (chat, dashboard, insights, settings)
- `backend/` - FastAPI service (`/health`, `/analyse`, reply policy, HF integration)

## Quick Start

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
HF_API_TOKEN=hf_xxx
HF_MODEL_ID=j-hartmann/emotion-english-distilroberta-base
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Run backend:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend/vite-project
npm install
npm run dev
```

Optional `frontend/vite-project/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## API Endpoints

- `GET /health`
  - service status
  - basic inference configuration checks
- `POST /analyse`
  - request: current user text + optional recent user messages
  - response: reply, normalized emotion, confidence, source

## Current Scope and Limitations

- This is a non-clinical prototype (not therapy, diagnosis, or crisis care).
- Rule-based safety handling is bounded and may miss phrasing edge cases.
- Mood and chat persistence are local to browser/user.
- External inference dependency means model/network outages can affect live results.

## Safety Note

If a user may be at immediate risk, the system should direct them to urgent human support.
In emergencies, users should contact local emergency services immediately.
