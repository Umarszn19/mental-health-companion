const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const MOCK_DELAY_MS = { min: 350, max: 900 }

const LABEL_MAP = {
  joy: 'joy',
  happy: 'joy',
  happiness: 'joy',
  neutral: 'neutral',
  sadness: 'sadness',
  sad: 'sadness',
  anger: 'anger',
  angry: 'anger',
  fear: 'fear',
  anxious: 'fear',
  anxiety: 'fear',
  surprise: 'surprise',
  disgust: 'disgust',
}

function randomDelay() {
  const ms = MOCK_DELAY_MS.min + Math.random() * (MOCK_DELAY_MS.max - MOCK_DELAY_MS.min)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeEmotion(label) {
  const key = String(label || '').trim().toLowerCase()
  return LABEL_MAP[key] || 'neutral'
}

function buildSupportiveReply(emotion) {
  const responses = {
    sadness: "Sounds rough — want to say a bit more about what's going on?",
    fear: "That sounds stressful. What's worrying you most right now?",
    anger: "Fair enough you're annoyed — what happened?",
    joy: "Good to hear something positive — anything you want to add?",
    surprise: "Sounds like a curveball — what bothered you most about it?",
    disgust: "That does sound grim — tell me another line about it?",
    neutral: "Thanks — what would help next, just talking things through?",
  }

  return responses[emotion] || responses.neutral
}

function containsImmediateRisk(text) {
  const lower = String(text || '').toLowerCase()
  return /(\bsuicid(e|al)\b|\bkill\b|\bkill myself\b|\bkill mysel[fv]\b|\bkms\b|\bself[- ]?harm\b|\boverdose\b|\bwant to die\b|\bend my life\b)/i.test(lower)
}

async function mockFromText(text, extra = {}) {
  await randomDelay()

  const lower = text.toLowerCase().trim()
  let emotion = 'neutral'
  let confidence = 0.65

  if (/^(hi|hello|hey|hiya)\b/.test(lower)) {
    return {
      reply: "Hi — what's going on for you today?",
      emotion: 'joy',
      confidence: 0.62,
      source: 'mock',
      ...extra,
    }
  }
  if (/^what\??$/.test(lower) || /^(what do you mean|wdym)\??$/i.test(lower)) {
    return {
      reply: 'Do you mean my last reply, or something else? Say it in a sentence if you can.',
      emotion: 'neutral',
      confidence: 0.55,
      source: 'mock',
      ...extra,
    }
  }

  if (/sad|depress|lonely|cry|hurt|hopeless/.test(lower)) {
    emotion = 'sadness'
    confidence = 0.78
  } else if (/angry|furious|annoyed|hate|rage/.test(lower)) {
    emotion = 'anger'
    confidence = 0.74
  } else if (/happy|great|excited|love|thanks|good|wonderful|amazing/.test(lower)) {
    emotion = 'joy'
    confidence = 0.71
  } else if (/anxious|stress|worried|panic|nervous|scared/.test(lower)) {
    emotion = 'fear'
    confidence = 0.76
  }

  return {
    reply: buildSupportiveReply(emotion),
    emotion,
    confidence,
    source: 'mock',
    ...extra,
  }
}

async function postAnalyze(text, recentUserMessages) {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/analyse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      recent_user_messages: recentUserMessages,
    }),
  })

  if (response.ok) {
    const data = await response.json()
    return { ok: true, data }
  }

  let detail = `HTTP ${response.status}`
  try {
    const err = await response.json()
    if (err?.detail) {
      detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)
    }
  } catch {
    try {
      detail = (await response.text()) || detail
    } catch {}
  }

  return { ok: false, status: response.status, detail }
}

export async function getBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/health`, { method: 'GET' })
    if (!response.ok) return { ok: false, error: 'unhealthy' }
    return { ok: true, ...(await response.json()) }
  } catch {
    return { ok: false, error: 'offline' }
  }
}

export async function sendChatMessage(text, recentUserMessages = []) {
  const cleanText = text.trim()
  if (!cleanText) {
    return {
      reply: "Type a bit more whenever you're ready.",
      emotion: 'neutral',
      confidence: 0.5,
      source: 'mock',
    }
  }

  if (containsImmediateRisk(cleanText)) {
    return {
      reply:
        'I am really glad you said this. Your safety matters most right now. Please contact immediate professional support now: call 999 if there is immediate danger, or NHS 111 for urgent help. If possible, tell a trusted person near you right away and do not stay alone.',
      emotion: 'fear',
      confidence: 1,
      source: 'safety',
    }
  }

  const prior = Array.isArray(recentUserMessages) ? recentUserMessages.slice(-8) : []

  try {
    const result = await postAnalyze(cleanText, prior)
    if (result.ok) {
      const data = result.data
      return {
        reply: data.reply,
        emotion: normalizeEmotion(data.emotion),
        confidence: Number(data.confidence ?? 0.5),
        source: data.source || 'backend',
      }
    }

    const detail = result.detail ? String(result.detail).slice(0, 400) : ''
    console.warn('POST /analyse failed', result.status, detail || result)
    return mockFromText(cleanText, {
      warning:
        'Could not reach the live companion service — showing a simple offline reply. Start the backend when you want real emotion detection.',
    })
  } catch (error) {
    console.warn(
      'Network error talking to backend. Start API: backend/.venv + `python -m uvicorn app.main:app --reload --port 8000`',
      error,
    )
    return mockFromText(cleanText, {
      warning:
        'Could not reach the live companion service — showing a simple offline reply. Start the backend when you want real emotion detection.',
    })
  }
}
