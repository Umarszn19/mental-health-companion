import { useEffect, useRef, useState } from 'react'
import AppShell from '../components/AppShell'
import styles from '../myCSS/AppSections.module.css'
import { getBackendHealth, sendChatMessage } from '../api/chat'
import { addMoodEntryForUser, createMoodEntry } from '../utils/moodTracker'
import { getChatHistoryForUser, saveChatHistoryForUser } from '../utils/chatStore'

const ChatPage = () => {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [apiStatus, setApiStatus] = useState(null)
  const bottomRef = useRef(null)

  const activeEmail = localStorage.getItem('activeUser')

  useEffect(() => {
    if (!activeEmail) return
    const saved = getChatHistoryForUser(activeEmail)
    if (saved.length > 0) {
      setMessages(saved)
    }
  }, [activeEmail])

  useEffect(() => {
    if (!activeEmail) return
    saveChatHistoryForUser(activeEmail, messages)
  }, [activeEmail, messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const h = await getBackendHealth()
      if (!cancelled) setApiStatus(h)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    const priorUserTexts = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .slice(-8)

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const data = await sendChatMessage(text, priorUserTexts)

      if (data?.emotion && activeEmail && data.source !== 'safety') {
        const moodEntry = createMoodEntry(data.emotion, data.confidence)
        addMoodEntryForUser(activeEmail, moodEntry)
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          emotion: data.emotion,
          confidence: data.confidence,
          source: data.source,
          warning: data.warning,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Could not load a reply — try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <AppShell
      title="Conversation"
      subtitle="Type freely — replies pick up emotion from your message."
    >
      <div className={styles.stack}>
        {!apiStatus?.ok && <p className={styles.mutedBox}>Backend looks offline — you may get mock replies.</p>}

        <section className={styles.grid2}>
          <article className={styles.card} aria-label="Chat conversation">
            <div
              style={{
                maxHeight: '420px',
                overflowY: 'auto',
                display: 'grid',
                gap: '12px',
                paddingRight: '4px',
              }}
            >
              {messages.length === 0 && !loading && (
                <p className={styles.cardHint}>Send a message to start — moods log from emotion detection.</p>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      lineHeight: 1.45,
                      fontSize: '0.95rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: m.role === 'user' ? '#fff' : '#21445b',
                      border: m.role === 'user' ? 'none' : '1px solid #d7e8ef',
                      background:
                        m.role === 'user'
                          ? 'linear-gradient(90deg, #1d4760 0%, #2f6f9a 100%)'
                          : '#f4fafc',
                    }}
                  >
                    {m.content}
                    {m.role === 'assistant' && m.source !== 'safety' && m.emotion != null && (
                      <div style={{ marginTop: '6px', color: '#5f7687', fontSize: '0.75rem' }}>
                        Emotion: {m.emotion}
                      </div>
                    )}
                    {m.role === 'assistant' && m.warning && (
                      <div className={styles.mutedBox}>{m.warning}</div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div aria-live="polite" className={styles.cardHint}>
                  …
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className={styles.row} style={{ marginTop: '14px' }}>
              <textarea
                className={styles.textArea}
                rows={2}
                placeholder="Type what is on your mind…"
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <button
                type="button"
                className={styles.buttonPrimary}
                disabled={loading || !input.trim()}
                onClick={handleSend}
              >
                Send
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Conversation starters</h3>
            <p className={styles.cardHint}>
              Use one of these if you are unsure how to begin.
            </p>
            <div className={styles.stack}>
              {[
                'I feel overwhelmed by coursework this week.',
                'I am anxious about deadlines and exams.',
                'I had a better day today, but I still feel drained.',
              ].map((starter) => (
                <button
                  key={starter}
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={() => setInput(starter)}
                >
                  {starter}
                </button>
              ))}
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  )
}

export default ChatPage
