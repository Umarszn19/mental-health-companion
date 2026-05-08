const JOURNAL_STORAGE_KEY = 'journalByUser'

function readStore() {
  const raw = localStorage.getItem(JOURNAL_STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(store))
}

export function getJournalEntriesForUser(email) {
  if (!email) return []
  const store = readStore()
  const rows = Array.isArray(store[email]) ? store[email] : []
  return rows
    .filter((r) => r && typeof r === 'object' && r.id && r.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function addJournalEntryForUser(email, entry) {
  if (!email || !entry) return
  const store = readStore()
  const existing = Array.isArray(store[email]) ? store[email] : []
  store[email] = [entry, ...existing].slice(0, 100)
  writeStore(store)
}

export function removeJournalEntryForUser(email, id) {
  if (!email || !id) return
  const store = readStore()
  const existing = Array.isArray(store[email]) ? store[email] : []
  store[email] = existing.filter((entry) => entry.id !== id)
  writeStore(store)
}

export function clearJournalEntriesForUser(email) {
  if (!email) return
  const store = readStore()
  delete store[email]
  writeStore(store)
}
