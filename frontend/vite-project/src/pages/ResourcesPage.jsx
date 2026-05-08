import AppShell from '../components/AppShell'
import styles from '../myCSS/AppSections.module.css'

const ResourcesPage = () => {
  return (
    <AppShell
      title="Resources"
      subtitle="Trusted support options for university stress, wellbeing, and urgent situations."
    >
      <div className={styles.stack}>
        <section className={styles.grid3}>
          <article className={styles.card}>
            <h3 className={styles.cardTitle}>University support</h3>
            <ul className={styles.list}>
              <li>
                University of Portsmouth wellbeing support line:{' '}
                <a href="https://www.port.ac.uk/student-life/support-wellbeing-and-inclusion/wellbeing" target="_blank" rel="noreferrer">
                  support and wellbeing service
                </a>
              </li>
              <li>Academic tutor or course mentor</li>
              <li>Disability and learning support team</li>
              <li>Student union advice service</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Community support</h3>
            <ul className={styles.list}>
              <li>GP or primary care appointment</li>
              <li>Local talking therapy pathways</li>
              <li>Peer support groups</li>
              <li>Evidence-based self-help programmes</li>
            </ul>
          </article>

          <article className={styles.card}>
            <h3 className={styles.cardTitle}>Immediate risk</h3>
            <ul className={styles.list}>
              <li>Contact 999 immediately in an emergency</li>
              <li>Call 111 for urgent medical advice</li>
              <li>Tell someone nearby you trust</li>
            </ul>
            <p className={styles.mutedBox}>
              If you feel at immediate risk of harm, do not wait for app support.
            </p>
          </article>
        </section>

        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Using resources with this app</h3>
          <p className={styles.cardHint}>
            Open Room helps with reflection and pattern awareness. For persistent or severe distress,
            combine app use with human support. You can use journal entries and insights as prompts during
            support appointments.
          </p>
        </section>
      </div>
    </AppShell>
  )
}

export default ResourcesPage
