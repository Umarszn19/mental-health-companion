import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import AppShell from '../components/AppShell'
import styles from '../myCSS/AppSections.module.css'
import { getMoodHistoryForUser, toChartData } from '../utils/moodTracker'

const POSITIVE_WORDS = ['Steady', 'Courageous', 'Hopeful', 'Balanced', 'Brave', 'Kind', 'Resilient']

function formatEmotionLabel(emotion) {
  if (!emotion) return 'Neutral'
  return emotion.charAt(0).toUpperCase() + emotion.slice(1)
}

function scoreToEmoji(score) {
  if (score >= 9) return '😄'
  if (score >= 7) return '🙂'
  if (score >= 5) return '😐'
  if (score >= 3) return '😟'
  return '😞'
}

const emojiAxisTicks = {
  2: '😞',
  4: '😟',
  6: '😐',
  8: '🙂',
  10: '😄',
}

const EmojiDot = ({ cx, cy, payload }) => {
  if (!payload) return null
  return (
    <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16}>
      {scoreToEmoji(payload.score)}
    </text>
  )
}

const HomePage = () => {
  let users = {}
  try {
    users = JSON.parse(localStorage.getItem('myAppUsers') || '{}') || {}
  } catch {
    users = {}
  }
  const currentUser = localStorage.getItem('activeUser')
  const activeUser = currentUser ? users[currentUser] : null
  const moodEntries = useMemo(() => getMoodHistoryForUser(currentUser), [currentUser])
  const moodData = useMemo(() => toChartData(moodEntries, 12), [moodEntries])
  const latestMood = moodEntries[moodEntries.length - 1]

  const weekEntries = useMemo(() => {
    const now = Date.now()
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    return moodEntries.filter((entry) => now - new Date(entry.timestamp).getTime() <= sevenDaysMs)
  }, [moodEntries])

  const dominantWeekEmotion = useMemo(() => {
    if (weekEntries.length === 0) return null
    const counts = {}
    weekEntries.forEach((entry) => {
      counts[entry.emotion] = (counts[entry.emotion] || 0) + 1
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : null
  }, [weekEntries])

  const todayKey = new Date().toISOString().slice(0, 10)
  const positiveWord = POSITIVE_WORDS[
    todayKey.split('-').reduce((sum, segment) => sum + Number(segment), 0) % POSITIVE_WORDS.length
  ]

  return (
    <AppShell
      title="Dashboard"
      subtitle="Mood trend from your chats and quick links elsewhere."
      showTopbar={false}
    >
      <div className={styles.stack}>
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>Welcome back, {activeUser?.firstname ?? 'there'}.</h2>
          <p className={styles.heroText}>
            Chats bump your timeline on the fly — use this page to skim how the last week looked.
          </p>
        </section>

        <section className={styles.statsGrid}>
          <article className={styles.card}>
            <p className={styles.cardHint}>This week</p>
            <p className={styles.value}>{latestMood ? formatEmotionLabel(latestMood.emotion) : 'No entries yet'}</p>
            <p className={styles.subValue}>Most recent emotional tone</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardHint}>This week</p>
            <p className={styles.value}>{dominantWeekEmotion ? formatEmotionLabel(dominantWeekEmotion) : 'No entries yet'}</p>
            <p className={styles.subValue}>Most common emotional pattern</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardHint}>Positive word of the day</p>
            <p className={styles.value}>{positiveWord}</p>
            <p className={styles.subValue}>Refreshes every 24 hours</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardHint}>Weekly check-ins</p>
            <p className={styles.value}>{weekEntries.length}</p>
            <p className={styles.subValue}>Chat moments in the last seven days</p>
          </article>
        </section>

        <section className={styles.grid2}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Recent emotional timeline</h3>
            <p className={styles.cardHint}>
              Easy view: emoji points show emotional tone across recent check-ins.
            </p>
            {moodData.length === 0 ? (
              <p className={styles.cardHint}>No entries yet. Chat a few times to build your trend graph.</p>
            ) : (
              <ResponsiveContainer width="100%" height={290}>
                <LineChart data={moodData} margin={{ top: 16, right: 22, left: 6, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5eadf" />
                  <XAxis
                    dataKey="xKey"
                    stroke="#4e6a59"
                    tickFormatter={(_, index) => moodData[index]?.label || ''}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    domain={[1, 10]}
                    ticks={[2, 4, 6, 8, 10]}
                    stroke="#4e6a59"
                    tickFormatter={(value) => emojiAxisTicks[value] || ''}
                  />
                  <Tooltip
                    formatter={(value) => [scoreToEmoji(Number(value)), 'Mood']}
                    labelFormatter={(label, items) =>
                      `${items?.[0]?.payload?.tooltipLabel || label} · ${formatEmotionLabel(items?.[0]?.payload?.emotion)}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2f8f62"
                    strokeWidth={2}
                    dot={<EmojiDot />}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            <p className={styles.cardHint}>Tip: 🙂 and 😄 suggest better moments, 😟 and 😞 suggest lower moments.</p>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Quick actions</h3>
            <p className={styles.cardHint}>Move between features quickly to keep your wellbeing routine simple.</p>
            <div className={styles.row}>
              <Link to="/chat" className={styles.linkButton}>Open chat</Link>
              <Link to="/journal" className={styles.buttonSecondary}>Add journal note</Link>
            </div>
            <div className={styles.mutedBox}>
              Latest detected emotion: {latestMood ? formatEmotionLabel(latestMood.emotion) : 'No entries yet'}
            </div>
          </article>
        </section>

        <section className={styles.grid3}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Suggested routine</h3>
            <ul className={styles.list}>
              <li>Morning check-in (1-2 lines about mood or priorities)</li>
              <li>Evening reflection (what helped, what felt heavy)</li>
              <li>Weekly review in Insights to identify recurring patterns</li>
            </ul>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Quick wellbeing tips</h3>
            <ul className={styles.list}>
              <li>Try one short check-in after classes to keep trends meaningful.</li>
              <li>Use specific emotion words for clearer confidence scores.</li>
              <li>If confidence feels off, provide more context in your next message.</li>
            </ul>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Explore more features</h3>
            <div className={styles.row}>
              <Link to="/insights" className={styles.buttonSecondary}>View insights</Link>
              <Link to="/resources" className={styles.buttonSecondary}>Open resources</Link>
            </div>
            <p className={styles.mutedBox}>
              This tool supports reflection and is not a substitute for professional mental health care.
            </p>
          </article>
        </section>
      </div>
    </AppShell>
  )
}

export default HomePage
