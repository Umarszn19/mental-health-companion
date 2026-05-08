import { useEffect } from 'react'
import { NavLink, Navigate, useNavigate } from 'react-router-dom'
import styles from '../myCSS/AppShell.module.css'

const navItems = [
  { to: '/home', label: 'Dashboard' },
  { to: '/chat', label: 'Chat' },
  { to: '/insights', label: 'Insights' },
  { to: '/journal', label: 'Journal' },
  { to: '/toolkit', label: 'Toolkit' },
  { to: '/resources', label: 'Resources' },
  { to: '/settings', label: 'Settings' },
]

const AppShell = ({ title, subtitle, children, showTopbar = true }) => {
  const navigate = useNavigate()
  let users = {}
  try {
    users = JSON.parse(localStorage.getItem('myAppUsers') || '{}') || {}
  } catch {
    users = {}
  }
  const activeEmail = localStorage.getItem('activeUser')
  const activeUser = activeEmail ? users[activeEmail] : null

  useEffect(() => {
    const savedTheme = localStorage.getItem('openRoomTheme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  if (!activeEmail) {
    return <Navigate to="/" replace />
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <p className={styles.brand}>Open Room</p>
          <p className={styles.brandSub}>Student Wellbeing Assistant</p>
          <nav className={styles.nav}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`.trim()
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={() => {
            localStorage.removeItem('activeUser')
            navigate('/')
          }}
        >
          Log out
        </button>
      </aside>

      <main className={styles.main}>
        {showTopbar ? (
          <header className={styles.topbar}>
            <div>
              <h1 className={styles.pageTitle}>{title}</h1>
              {subtitle ? <p className={styles.pageSubtitle}>{subtitle}</p> : null}
            </div>
            <div className={styles.userPill}>
              <span className={styles.userName}>
                {activeUser?.firstname ? `${activeUser.firstname} ${activeUser.surname || ''}`.trim() : activeEmail}
              </span>
            </div>
          </header>
        ) : null}

        <section className={styles.content}>{children}</section>
      </main>
    </div>
  )
}

export default AppShell
