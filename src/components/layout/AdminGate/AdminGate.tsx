import Button from '@components/common/Button'
import Card from '@components/common/Card'
import { useAdminStore } from '@features/admin'
import { useTranslation } from 'react-i18next'

import styles from './AdminGate.module.css'

import type { ReactNode } from 'react'

interface AdminGateProps {
  children: ReactNode
}

/**
 * Shared gate for every /admin route. The repo has no auth, so this is a
 * deliberate local-only demo toggle (persisted per browser) — the gate copy
 * says so instead of pretending to be a login.
 */
function AdminGate({ children }: AdminGateProps) {
  const { t } = useTranslation()
  const isAdmin = useAdminStore((s) => s.isAdmin)
  const enableAdmin = useAdminStore((s) => s.enableAdmin)

  if (!isAdmin) {
    return (
      <section className={styles.page}>
        <Card padding="lg" className={styles.gate}>
          <Card.Body>
            <h1>{t('admin.gateTitle')}</h1>
            <p className={styles.subtitle}>{t('admin.gateDesc')}</p>
            <Button variant="primary" onClick={enableAdmin}>
              {t('admin.enable')}
            </Button>
          </Card.Body>
        </Card>
      </section>
    )
  }

  return <>{children}</>
}

export default AdminGate
