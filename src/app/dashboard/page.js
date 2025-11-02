import DashboardLayout from '@/components/DashboardLayout'
import styles from './page.module.css'

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Panel de Control</h1>
          <p>Bienvenido al Sistema SRORN</p>
        </div>
        <div className={styles.welcome}>
          <p>Seleccione una opción del menú lateral para comenzar.</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

