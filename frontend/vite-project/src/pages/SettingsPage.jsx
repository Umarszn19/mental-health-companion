import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell'
import styles from '../myCSS/AppSections.module.css'
import { clearMoodHistoryForUser, getMoodHistoryForUser } from '../utils/moodTracker'
import { clearJournalEntriesForUser, getJournalEntriesForUser } from '../utils/journalStore'

const SettingsPage = () => {
  const navigate = useNavigate()
  const activeEmail = localStorage.getItem('activeUser')

  const moodCount = useMemo(() => getMoodHistoryForUser(activeEmail).length, [activeEmail])
  const journalCount = useMemo(() => getJournalEntriesForUser(activeEmail).length, [activeEmail])

  const [theme, setTheme] = useState(localStorage.getItem('openRoomTheme') || 'light')

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme)
    localStorage.setItem('openRoomTheme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  const deleteAccount = () => {
    if (!activeEmail) return
    const confirmed = window.confirm(
      'Delete your account and all local Open Room data on this browser? This cannot be undone.'
    )
    if (!confirmed) return

    const users = JSON.parse(localStorage.getItem('myAppUsers') || '{}') || {}
    delete users[activeEmail]
    localStorage.setItem('myAppUsers', JSON.stringify(users))
    clearMoodHistoryForUser(activeEmail)
    clearJournalEntriesForUser(activeEmail)
    localStorage.removeItem('activeUser')
    navigate('/')
  }

  return (
    <AppShell
      title="Settings"
      subtitle="Control theme preferences and account actions."
    >
      <div className={styles.stack}>
        <section className={styles.grid2}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Theme mode</h3>
            <p className={styles.cardHint}>Choose your preferred appearance style.</p>
            <div className={styles.row}>
              <button
                type="button"
                className={theme === 'light' ? styles.buttonPrimary : styles.buttonSecondary}
                onClick={() => applyTheme('light')}
              >
                Light mode
              </button>
              <button
                type="button"
                className={theme === 'dark' ? styles.buttonPrimary : styles.buttonSecondary}
                onClick={() => applyTheme('dark')}
              >
                Dark mode
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Delete account</h3>
            <p className={styles.cardHint}>Your local account data on this browser:</p>
            <ul className={styles.list}>
              <li>Mood entries: {moodCount}</li>
              <li>Journal entries: {journalCount}</li>
            </ul>
            <button type="button" className={styles.buttonSecondary} onClick={deleteAccount}>
              Delete my account
            </button>
          </article>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Important scope notice</h3>
          <ul className={styles.list}>
            <li>Open Room is a non-clinical reflection prototype.</li>
            <li>Automated predictions may be inaccurate or uncertain.</li>
            <li>For serious or persistent mental health concerns, use professional support services.</li>
          </ul>
        </section>
      </div>
    </AppShell>
  )
}

export default SettingsPage
