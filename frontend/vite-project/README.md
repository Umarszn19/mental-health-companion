# Open Room — frontend (Vite + React)

This frontend includes:
- Login / account pages
- Chat UI
- Mood trend chart on Home (updated from chat emotions)
- Hugging Face emotion integration with mock fallback

## 1) Install and run

```bash
npm install
npm run dev
```

## 2) Configure Hugging Face (optional)

Create `.env.local` in this folder:

```env
VITE_HF_API_TOKEN=hf_your_token_here
VITE_HF_MODEL_ID=j-hartmann/emotion-english-distilroberta-base
```

If no token is set, chat automatically uses local mock logic.

## 3) Security note

`VITE_` env vars are bundled into client code. This integration is suitable for local prototype/demo only.
For production, move Hugging Face calls to FastAPI and keep your token server-side.
