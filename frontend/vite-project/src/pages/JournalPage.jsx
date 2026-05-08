import { useMemo, useState } from 'react'
import AppShell from '../components/AppShell'
import styles from '../myCSS/AppSections.module.css'
import {
  addJournalEntryForUser,
  getJournalEntriesForUser,
  removeJournalEntryForUser,
} from '../utils/journalStore'

const JournalPage = () => {
  const activeEmail = localStorage.getItem('activeUser')
  const [entryText, setEntryText] = useState('')
  const [tag, setTag] = useState('general')
  const [refreshSeed, setRefreshSeed] = useState(0)

  const entries = useMemo(() => {
    void refreshSeed
    return getJournalEntriesForUser(activeEmail)
  }, [activeEmail, refreshSeed])

  const addEntry = () => {
    const text = entryText.trim()
    if (!text) return
    addJournalEntryForUser(activeEmail, {
      id: crypto.randomUUID(),
      text,
      tag,
      timestamp: new Date().toISOString(),
    })
    setEntryText('')
    setTag('general')
    setRefreshSeed((v) => v + 1)
  }

  const removeEntry = (id) => {
    removeJournalEntryForUser(activeEmail, id)
    setRefreshSeed((v) => v + 1)
  }

  return (
    <AppShell
      title="Journal"
      subtitle="Capture context alongside your mood trend so patterns are easier to interpret."
    >
      <div className={styles.stack}>
        <section className={styles.grid2}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Write a new entry</h3>
            <p className={styles.cardHint}>Short entries are enough. Focus on triggers, thoughts, and support needed.</p>
            <div className={styles.row}>
              <select className={styles.select} value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="general">General</option>
                <option value="study">Study stress</option>
                <option value="social">Social/relationships</option>
                <option value="sleep">Sleep/energy</option>
                <option value="health">Physical wellbeing</option>
              </select>
            </div>
            <textarea
              className={styles.textArea}
              placeholder="What happened today? What helped? What felt difficult?"
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
            />
            <div className={styles.row}>
              <button type="button" className={styles.buttonPrimary} onClick={addEntry}>
                Save entry
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Journal guidance</h3>
            <ul className={styles.list}>
              <li>Write what happened before and after a mood change.</li>
              <li>Tag entries so you can spot recurring categories.</li>
              <li>Use entries to explain chart spikes and dips in Insights.</li>
              <li>Keep language honest; this is your private reflection space.</li>
            </ul>
          </article>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Saved entries</h3>
          {entries.length === 0 ? (
            <p className={styles.cardHint}>No entries yet. Add your first note above.</p>
          ) : (
            <div className={styles.stack}>
              {entries.map((entry) => (
                <article key={entry.id} className={styles.mutedBox}>
                  <p style={{ fontWeight: 600 }}>
                    {entry.tag} · {new Date(entry.timestamp).toLocaleString('en-GB')}
                  </p>
                  <p style={{ marginTop: '6px', lineHeight: 1.45 }}>{entry.text}</p>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    style={{ marginTop: '10px' }}
                    onClick={() => removeEntry(entry.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default JournalPage
