import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Input from '@components/common/Input'
import { login, useAuthStore } from '@features/auth'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './AdminGate.module.css'

interface AdminGateProps {
  children: ReactNode
}

function AdminGate({ children }: AdminGateProps) {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await login({ email, password })
      if (session.account.role !== 'admin' && session.account.role !== 'moderator') {
        clearSession()
        setError(t('admin.gateRoleError'))
      }
    } catch {
      setError(t('admin.gateLoginError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAdmin) {
    return (
      <section className={styles.page}>
        <Card padding="lg" className={styles.gate}>
          <Card.Body>
            <h1>{t('admin.gateTitle')}</h1>
            <p className={styles.subtitle}>{t('admin.gateDesc')}</p>
            <form className={styles.form} onSubmit={onSubmit}>
              <Input
                label={t('admin.email')}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
              />
              <Input
                label={t('admin.password')}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
              />
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <Button variant="primary" type="submit" isLoading={submitting}>
                {t('admin.login')}
              </Button>
            </form>
          </Card.Body>
        </Card>
      </section>
    )
  }

  return <>{children}</>
}

export default AdminGate
