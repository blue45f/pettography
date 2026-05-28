import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import { usePartnersStore, type PartnerKind, type PartnerStatus } from '@features/partners'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './PartnerDashboard.module.css'

const STATUS_VARIANT: Record<PartnerStatus, 'success' | 'warning' | 'error'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
}

function PartnerDashboard() {
  const { t } = useTranslation()
  useDocumentTitle(t('partnerDashboard.title'))

  const applications = usePartnersStore((s) => s.applications)

  const approved = useMemo(
    () => applications.filter((a) => a.status === 'approved'),
    [applications],
  )
  const pending = useMemo(() => applications.filter((a) => a.status === 'pending'), [applications])
  const kindTotals = useMemo(() => {
    const map: Record<PartnerKind, number> = { shop: 0, hospital: 0, 'treat-shop': 0 }
    for (const a of applications) {
      if (a.status === 'approved') map[a.kind]++
    }
    return map
  }, [applications])
  const regionTotals = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of applications) {
      if (a.status !== 'approved') continue
      const region = a.region || '—'
      counts[region] = (counts[region] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [applications])

  return (
    <section className={styles.page}>
      <header className={styles.heroHeader}>
        <h1>{t('partnerDashboard.title')}</h1>
        <p className={styles.subtitle}>{t('partnerDashboard.subtitle')}</p>
        <div className={styles.heroActions}>
          <Link to="/partners" className={styles.heroLink}>
            {t('partnerDashboard.applyMore')} →
          </Link>
          <Link to="/admin" className={styles.heroLink}>
            {t('partnerDashboard.openAdmin')} →
          </Link>
        </div>
      </header>

      {pending.length > 0 && (
        <p className={styles.pendingHint}>
          {t('partnerDashboard.pendingHint', { count: pending.length })}
        </p>
      )}

      <section aria-labelledby="my-stores" className={styles.section}>
        <h2 id="my-stores" className={styles.sectionTitle}>
          {t('partnerDashboard.myStoresTitle', { count: approved.length })}
        </h2>
        {approved.length === 0 ? (
          <EmptyState icon="🏪" title={t('partnerDashboard.noApproved')} />
        ) : (
          <ul className={styles.storeList}>
            {approved.map((a) => (
              <li key={a.id} className={styles.storeCard}>
                <header className={styles.storeHeader}>
                  <div>
                    <h3 className={styles.storeName}>{a.name}</h3>
                    <p className={styles.storeMeta}>
                      {t(`partners.kinds.${a.kind}`)} · {a.region}
                    </p>
                  </div>
                  <div className={styles.storeBadges}>
                    <Badge variant={STATUS_VARIANT[a.status]}>
                      {t(`partnerDashboard.statusLine.${a.status}`)}
                    </Badge>
                    <Badge variant="primary">{t('partnerDashboard.certifiedBadge')}</Badge>
                  </div>
                </header>
                <p className={styles.storeDesc}>{a.description}</p>
                <footer className={styles.storeFooter}>
                  <span className={styles.contactLine}>{a.contact}</span>
                  {a.url && (
                    <a className={styles.openLink} href={a.url} target="_blank" rel="noreferrer">
                      {t('partnerDashboard.openOnSite')} ↗
                    </a>
                  )}
                </footer>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.totalsGrid}>
        <Card padding="lg" className={styles.totalsCard}>
          <Card.Body>
            <h3 className={styles.totalsTitle}>{t('partnerDashboard.kindTotalsTitle')}</h3>
            <ul className={styles.totalsList}>
              {(Object.entries(kindTotals) as [PartnerKind, number][]).map(([kind, count]) => (
                <li key={kind}>
                  <span>{t(`partners.kinds.${kind}`)}</span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>

        <Card padding="lg" className={styles.totalsCard}>
          <Card.Body>
            <h3 className={styles.totalsTitle}>{t('partnerDashboard.regionTotalsTitle')}</h3>
            {regionTotals.length === 0 ? (
              <p className={styles.empty}>—</p>
            ) : (
              <ul className={styles.totalsList}>
                {regionTotals.map(([region, count]) => (
                  <li key={region}>
                    <span>{region}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </div>

      <div className={styles.footerActions}>
        <Link to="/partners" className={styles.outlineLink}>
          {t('partnerDashboard.applyMore')}
        </Link>
        <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑ Top
        </Button>
      </div>
    </section>
  )
}

export default PartnerDashboard
