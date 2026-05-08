import { useEffect, useState } from 'react'
import AppShell from '../components/AppShell'
import styles from '../myCSS/AppSections.module.css'

const ToolkitPage = () => {
  const [secondsLeft, setSecondsLeft] = useState(60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    if (secondsLeft <= 0) {
      setRunning(false)
      return
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [running, secondsLeft])

  return (
    <AppShell
      title="Toolkit"
      subtitle="Small practical exercises for regulation, reflection, and daily grounding."
    >
      <div className={styles.stack}>
        <section className={styles.grid3}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Breathing reset (60s)</h3>
            <p className={styles.cardHint}>
              Inhale 4 seconds, hold 2 seconds, exhale 6 seconds. Repeat gently.
            </p>
            <p className={styles.value}>{secondsLeft}s</p>
            <div className={styles.row}>
              <button type="button" className={styles.buttonPrimary} onClick={() => setRunning(true)}>
                Start
              </button>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={() => {
                  setRunning(false)
                  setSecondsLeft(60)
                }}
              >
                Reset
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Thought reframing</h3>
            <ul className={styles.list}>
              <li>What thought is driving my stress right now?</li>
              <li>What evidence supports and challenges it?</li>
              <li>What is a more balanced alternative statement?</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Energy check</h3>
            <ul className={styles.list}>
              <li>Sleep quality from 1-10</li>
              <li>Hydration and meal check</li>
              <li>One short movement break</li>
              <li>One realistic task for today</li>
            </ul>
          </article>
        </section>

        <section className={styles.grid2}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Grounding options</h3>
            <ul className={styles.list}>
              <li>5-4-3-2-1 sensory grounding</li>
              <li>Name 3 things you can control in the next hour</li>
              <li>Write one message to someone supportive</li>
              <li>Take a 5-minute walk and return to one priority task</li>
            </ul>
          </article>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>How this links to your trend</h3>
            <p className={styles.cardHint}>
              Use these tools before or after chat check-ins. Over time, your mood graph and journal entries
              can reveal which tools are most useful for you.
            </p>
            <p className={styles.mutedBox}>
              Safety note: this toolkit supports self-reflection and does not replace professional care.
            </p>
          </article>
        </section>
      </div>
    </AppShell>
  )
}

export default ToolkitPage
