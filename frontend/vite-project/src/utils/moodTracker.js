const MOOD_STORAGE_KEY = "moodHistoryByUser"

const EMOTION_BASE_SCORES = {
  joy: 8.5,
  neutral: 5.0,
  sadness: 3.0,
  fear: 3.5,
  anger: 2.5,
  surprise: 6.0,
  disgust: 2.0,
}

function clampScore(value) {
  if (Number.isNaN(value)) return 5
  return Math.max(1, Math.min(10, value))
}

function toConfidenceNumber(confidence) {
  if (typeof confidence !== "number") return null
  if (confidence > 1) return Math.max(0, Math.min(1, confidence / 100))
  return Math.max(0, Math.min(1, confidence))
}

function getBaseScore(emotion) {
  return EMOTION_BASE_SCORES[String(emotion || "").toLowerCase()] ?? 5
}

export function emotionToMoodScore(emotion, confidence) {
  const base = getBaseScore(emotion)
  const confidenceNum = toConfidenceNumber(confidence)

  if (confidenceNum == null) return clampScore(base)

  const midpoint = 5
  const weighted = midpoint + (base - midpoint) * confidenceNum
  return clampScore(Number(weighted.toFixed(2)))
}

export function createMoodEntry(emotion, confidence, timestamp = Date.now()) {
  const date = new Date(timestamp)
  const day = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date)
  const dateNum = String(date.getDate()).padStart(2, "0")

  return {
    timestamp: date.getTime(),
    day,
    dateNum,
    emotion: String(emotion || "neutral").toLowerCase(),
    confidence: typeof confidence === "number" ? confidence : null,
    score: emotionToMoodScore(emotion, confidence),
  }
}

function readStore() {
  const raw = localStorage.getItem(MOOD_STORAGE_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(store))
}

export function getMoodHistoryForUser(email) {
  if (!email) return []

  const store = readStore()
  const rows = Array.isArray(store[email]) ? store[email] : []

  return rows
    .filter((r) => r && typeof r === "object" && r.timestamp && typeof r.score === "number")
    .sort((a, b) => {
      const aTs = Number.isFinite(Number(a.timestamp)) ? Number(a.timestamp) : new Date(a.timestamp).getTime()
      const bTs = Number.isFinite(Number(b.timestamp)) ? Number(b.timestamp) : new Date(b.timestamp).getTime()
      return aTs - bTs
    })
}

export function addMoodEntryForUser(email, entry) {
  if (!email || !entry) return

  const store = readStore()
  const existing = Array.isArray(store[email]) ? store[email] : []
  const updated = [...existing, entry].slice(-60)

  store[email] = updated
  writeStore(store)
}

export function clearMoodHistoryForUser(email) {
  if (!email) return
  const store = readStore()
  delete store[email]
  writeStore(store)
}

export function toChartData(entries, maxPoints = 10) {
  return (Array.isArray(entries) ? entries : []).slice(-maxPoints).map((entry, index) => {
    const parsedTs = Number.isFinite(Number(entry.timestamp))
      ? Number(entry.timestamp)
      : new Date(entry.timestamp).getTime()
    const date = new Date(parsedTs)
    const day = entry.day || new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date)
    const dateNum = entry.dateNum || String(date.getDate()).padStart(2, "0")

    return {
      xKey: `${parsedTs}-${index}`,
      label: `${day} ${dateNum}`,
      tooltipLabel: `${day} ${dateNum}`,
      score: Number(entry.score.toFixed(2)),
      emotion: entry.emotion,
      confidence: entry.confidence,
    }
  })
}
