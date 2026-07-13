import Button from '@components/common/Button'
import Card from '@components/common/Card'
import Input from '@components/common/Input'
import { fetchMe, login, useAuthStore } from '@domains/auth'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './AdminGate.module.css'

interface AdminGateProps {
  children: ReactNode
}

function AdminGate({ children }: AdminGateProps) {
  const { t } = useTranslation()
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const token = useAuthStore((s) => s.token)
  const clearSession = useAuthStore((s) => s.clearSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkingSession, setCheckingSession] = useState(Boolean(token))

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      if (!token) {
        if (active) setCheckingSession(false)
        return
      }

      setCheckingSession(true)
      try {
        await fetchMe()
      } catch {
        if (active) clearSession()
      } finally {
        if (active) setCheckingSession(false)
      }
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [clearSession, token])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const session = await login({ email: email.trim(), password })
      if (session.account.role !== 'admin' && session.account.role !== 'moderator') {
        clearSession()
        setPassword('')
        setError(t('admin.gateRoleError'))
      }
    } catch {
      setPassword('')
      setError(t('admin.gateLoginError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingSession) {
    return (
      <section className={styles.page}>
        <Card padding="lg" className={styles.gate}>
          <Card.Body>
            <p className={styles.checking} role="status">
              {t('admin.checkingSession')}
            </p>
          </Card.Body>
        </Card>
      </section>
    )
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
                inputMode="email"
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
              />
              <Input
                label={t('admin.password')}
                type="password"
                maxLength={256}
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
              <Button
                variant="primary"
                type="submit"
                isLoading={submitting}
                disabled={!email.trim() || !password}
              >
                {t('admin.login')}
              </Button>
              <Link to="/" className={styles.backLink}>
                {t('admin.backToService')}
              </Link>
            </form>
          </Card.Body>
        </Card>
      </section>
    )
  }

  return <>{children}</>
}

export default AdminGate
