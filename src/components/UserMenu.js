'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './UserMenu.module.css'

export default function UserMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if API call fails
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        className={styles.userButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className={styles.user}>
          <i className="fas fa-user-circle"></i>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.nombre}</span>
            <span className={styles.userRole}>{user.roles.join(', ')}</span>
          </div>
          <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </div>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div className={styles.dropdownName}>{user.nombre}</div>
            <div className={styles.dropdownEmail}>{user.email}</div>
          </div>
          <div className={styles.dropdownDivider}></div>
          <button
            className={styles.dropdownItem}
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  )
}
