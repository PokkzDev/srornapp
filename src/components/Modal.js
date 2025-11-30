'use client'

import { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

export default function Modal({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'Aceptar', showCancel = false, cancelText = 'Cancelar' }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
      document.body.style.overflow = 'hidden'
    } else {
      if (dialog.open) {
        dialog.close()
      }
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (e) => {
      e.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [onClose])

  const handleBackdropClick = (e) => {
    const dialog = dialogRef.current
    if (e.target === dialog) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    } else {
      onClose()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle'
      case 'error':
        return 'fas fa-exclamation-circle'
      case 'warning':
        return 'fas fa-exclamation-triangle'
      case 'info':
      default:
        return 'fas fa-info-circle'
    }
  }

  return (
    <dialog 
      ref={dialogRef}
      className={styles.modalOverlay} 
      onClick={handleBackdropClick}
      aria-labelledby="modal-title"
    >
      <div className={styles.modalContent}>
        <div className={`${styles.modalHeader} ${styles[`header${type.charAt(0).toUpperCase() + type.slice(1)}`]}`}>
          <div className={styles.modalIcon}>
            <i className={getIcon()}></i>
          </div>
          <h2 id="modal-title" className={styles.modalTitle}>{title}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className={styles.modalBody}>
          <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          {showCancel && (
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button type="button" className={`${styles.btnConfirm} ${styles[`btn${type.charAt(0).toUpperCase() + type.slice(1)}`]}`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </dialog>
  )
}

