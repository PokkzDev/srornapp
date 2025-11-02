import Sidebar from '@/components/Sidebar'
import styles from './DashboardLayout.module.css'

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}

