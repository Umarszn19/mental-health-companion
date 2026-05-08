const CHAT_STORAGE_KEY = 'chatHistoryByUser'

function readStore() {
  const raw = localStorage.getItem(CHAT_STORAGE_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(store))
}

export function getChatHistoryForUser(email) {
  if (!email) return []
  const store = readStore()
  return Array.isArray(store[email]) ? store[email] : []
}

export function saveChatHistoryForUser(email, messages) {
  if (!email) return
  const store = readStore()
  store[email] = Array.isArray(messages) ? messages.slice(-200) : []
  writeStore(store)
}

export function clearChatHistoryForUser(email) {
  if (!email) return
  const store = readStore()
  delete store[email]
  writeStore(store)
}
