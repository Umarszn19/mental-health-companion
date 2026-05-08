import { useMemo } from 'react'
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

const InsightsPage = () => {
  const activeEmail = localStorage.getItem('activeUser')
  const moodEntries = useMemo(() => getMoodHistoryForUser(activeEmail), [activeEmail])
  const chartData = useMemo(() => toChartData(moodEntries, 30), [moodEntries])

  const emotionCounts = useMemo(() => {
    const counts = {}
    moodEntries.forEach((entry) => {
      counts[entry.emotion] = (counts[entry.emotion] || 0) + 1
    })
    return Object.entries(counts).map(([emotion, count]) => ({ emotion, count }))
  }, [moodEntries])

  const highestEmotion = [...emotionCounts].sort((a, b) => b.count - a.count)[0]
  const latestEmotion = moodEntries[moodEntries.length - 1]?.emotion || null
  return (
    <AppShell
      title="Insights"
      subtitle="Chart and counts from recent chat mood picks."
    >
      <div className={styles.stack}>
        <section className={styles.statsGrid}>
          <article className={styles.card}>
            <p className={styles.cardHint}>Current emotional tone</p>
            <p className={styles.value}>{latestEmotion ? formatEmotionLabel(latestEmotion) : 'No entries yet'}</p>
            <p className={styles.subValue}>From your most recent chat messages</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardHint}>Most common feeling</p>
            <p className={styles.value}>{highestEmotion ? formatEmotionLabel(highestEmotion.emotion) : 'No entries yet'}</p>
            <p className={styles.subValue}>Most often detected this week</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardHint}>Emotional variation</p>
            <p className={styles.value}>{emotionCounts.length > 3 ? 'Mixed' : 'Steady'}</p>
            <p className={styles.subValue}>Based on how varied recent emotions are</p>
          </article>
          <article className={styles.card}>
            <p className={styles.cardHint}>Insight confidence</p>
            <p className={styles.value}>{moodEntries.length >= 8 ? 'Strong' : 'Growing'}</p>
            <p className={styles.subValue}>More conversations improve reliability</p>
          </article>
        </section>

        <section className={styles.grid2}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Mood trend chart</h3>
            <p className={styles.cardHint}>Trend view based on your recent emotion-based chat history.</p>
            {chartData.length === 0 ? (
              <p className={styles.cardHint}>No entries yet. Use chat to build your mood trend.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 12, right: 20, left: 6, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d5eadf" />
                  <XAxis
                    dataKey="xKey"
                    stroke="#4e6a59"
                    tickFormatter={(_, index) => chartData[index]?.label || ''}
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
                    strokeWidth={3}
                    dot={<EmojiDot />}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Emotion highlights</h3>
            <p className={styles.cardHint}>Friendly summaries from your recent conversations.</p>
            {emotionCounts.length === 0 ? (
              <p className={styles.cardHint}>No highlights available yet.</p>
            ) : (
              <div className={styles.stack}>
                {[...emotionCounts]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.emotion} className={styles.mutedBox}>
                      <strong>{formatEmotionLabel(item.emotion)}</strong> is showing up in your recent chats.
                    </div>
                  ))}
              </div>
            )}
          </article>
        </section>

        <section className={styles.grid3}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>How to read this page</h3>
            <ul className={styles.list}>
              <li>Use emotional patterns for reflection, not diagnosis.</li>
              <li>Compare emotion distribution week by week.</li>
              <li>Cross-check unusual spikes with journal notes.</li>
            </ul>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Limitations</h3>
            <ul className={styles.list}>
              <li>Model misclassification can shift chart points.</li>
              <li>Short or ambiguous messages lower confidence quality.</li>
              <li>This prototype does not replace clinical support.</li>
            </ul>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Next best action</h3>
            <p className={styles.cardHint}>
              If your trend drops over several points, open Chat and describe context. If you feel unsafe,
              use crisis support immediately.
            </p>
          </article>
        </section>
      </div>
    </AppShell>
  )
}

export default InsightsPage
