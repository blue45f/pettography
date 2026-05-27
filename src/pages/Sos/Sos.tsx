import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import { findChecklist, NATIONAL_HOTLINES, type EmergencyChecklistItem } from '@features/emergency'
import { useHospitalsList } from '@features/hospitals'
import { useOnboardingStore } from '@features/onboarding'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Sos.module.css'

const SEVERITY_VARIANT: Record<
  EmergencyChecklistItem['severity'],
  'error' | 'warning' | 'default'
> = {
  critical: 'error',
  high: 'warning',
  watch: 'default',
}

function Sos() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  useDocumentTitle(t('sos.title'))

  const origin = useMemo(
    () => (profile.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined),
    [profile.location]
  )

  const hospitalsQuery = useHospitalsList(
    profile.category ? { category: profile.category, origin } : { origin }
  )

  const emergencyHospitals = useMemo(() => {
    const data = hospitalsQuery.data ?? []
    const sorted = [...data].sort((a, b) => {
      if (a.hasEmergency !== b.hasEmergency) return a.hasEmergency ? -1 : 1
      return a.distanceKm - b.distanceKm
    })
    const onlyEmergency = sorted.filter((h) => h.hasEmergency)
    return {
      primary: onlyEmergency.length ? onlyEmergency : sorted.slice(0, 2),
      fellBack: !onlyEmergency.length,
    }
  }, [hospitalsQuery.data])

  const checklist = findChecklist(profile.category)

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.tag}>SOS</p>
        <h1 className={styles.title}>{t('sos.title')}</h1>
        <p className={styles.subtitle}>{t('sos.subtitle')}</p>
      </header>

      {!profile.category && (
        <Card padding="lg" className={styles.gateCard}>
          <Card.Body>
            <h2 className={styles.gateTitle}>{t('sos.noCategoryTitle')}</h2>
            <p className={styles.gateDesc}>{t('sos.noCategoryDesc')}</p>
            <Link to="/onboarding" className={styles.gateCta}>
              {t('sos.startOnboarding')} →
            </Link>
          </Card.Body>
        </Card>
      )}

      <section aria-labelledby="sos-vets" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="sos-vets" className={styles.sectionTitle}>
            {t('sos.nearbyTitle')}
          </h2>
          {emergencyHospitals.fellBack && <p className={styles.fallback}>{t('sos.noEmergency')}</p>}
        </header>
        {hospitalsQuery.isLoading && <p className={styles.loading}>{t('common.loading')}</p>}
        <ul className={styles.vetList}>
          {emergencyHospitals.primary.slice(0, 4).map((h, idx) => (
            <li key={h.id} className={styles.vetItem}>
              <div className={styles.vetRank} aria-hidden="true">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className={styles.vetBody}>
                <div className={styles.vetTopRow}>
                  <h3 className={styles.vetName}>{h.name}</h3>
                  {h.hasEmergency && <Badge variant="error">{t('hospitals.emergencyBadge')}</Badge>}
                </div>
                <p className={styles.vetMeta}>
                  {h.address}
                  {Number.isFinite(h.distanceKm) && ` · ${h.distanceKm}km`}
                </p>
                <p className={styles.vetHours}>{h.hours}</p>
              </div>
              <div className={styles.vetActions}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    window.location.href = `tel:${h.phone}`
                  }}
                >
                  {t('sos.callNow')}
                </Button>
                <a href={h.mapUrl} target="_blank" rel="noreferrer" className={styles.mapLink}>
                  {t('sos.openMap')} ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {checklist && (
        <section aria-labelledby="sos-checklist" className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2 id="sos-checklist" className={styles.sectionTitle}>
              {t('sos.checklistTitle')}
            </h2>
            <p className={styles.intro}>{checklist.intro}</p>
          </header>
          <ol className={styles.checklist}>
            {checklist.items.map((item) => (
              <li key={item.id} className={styles[`severity-${item.severity}`]}>
                <Badge variant={SEVERITY_VARIANT[item.severity]}>
                  {t(`sos.severity.${item.severity}`)}
                </Badge>
                <div>
                  <p className={styles.symptom}>{item.symptom}</p>
                  <p className={styles.action}>{item.action}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!checklist && profile.category && <EmptyState icon="🩺" title={t('sos.noCategoryDesc')} />}

      <section aria-labelledby="sos-hotlines" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="sos-hotlines" className={styles.sectionTitle}>
            {t('sos.hotlineTitle')}
          </h2>
        </header>
        <ul className={styles.hotlines}>
          {NATIONAL_HOTLINES.map((line) => (
            <li key={line.id} className={styles.hotlineItem}>
              <div>
                <strong>{line.name}</strong>
                {line.phone && <p className={styles.hotlinePhone}>{line.phone}</p>}
              </div>
              <div className={styles.hotlineActions}>
                {line.phone && (
                  <a href={`tel:${line.phone}`} className={styles.hotlineCall}>
                    {t('sos.callNow')}
                  </a>
                )}
                <a href={line.url} target="_blank" rel="noreferrer" className={styles.hotlineLink}>
                  {t('common.openLink')} ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.disclaimer}>{t('sos.disclaimer')}</p>
    </section>
  )
}

export default Sos
