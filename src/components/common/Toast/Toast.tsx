import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'

import styles from './Toast.module.css'
import { ToastContext, type ToastType } from './ToastContext'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const contextValue = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={styles.container} role="region" aria-live="polite" aria-label="알림">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  const isError = toast.type === 'error'
  return (
    <div
      className={`${styles.toast} ${styles[toast.type]}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <span className={styles.message}>{toast.message}</span>
      <button
        className={styles.close}
        onClick={() => onClose(toast.id)}
        aria-label="알림 닫기"
        type="button"
      >
        &times;
      </button>
    </div>
  )
}

export { ToastProvider }
export default ToastProvider
