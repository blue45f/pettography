import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import { findChecklist, NATIONAL_HOTLINES, type EmergencyChecklistItem } from '@domains/emergency'
import { useHospitalsList } from '@domains/hospitals'
import { useOnboardingStore } from '@domains/onboarding'
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
      fellBack: data.length > 0 && !onlyEmergency.length,
    }
  }, [hospitalsQuery.data])

  const checklist = findChecklist(profile.category)

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.tag}>SOS</p>
        <h1 className={styles.title}>{t('sos.title')}</h1>
        <p className={styles.subtitle}>{t('sos.subtitle')}</p>
        <div className={styles.locationBar}>
          <span>
            {profile.location
              ? t('dashboard.locationNote', { label: profile.location.label })
              : t('hospitals.subtitle')}
          </span>
          <Link to="/onboarding" className={styles.locationLink}>
            {t('dashboard.changeLocation')} →
          </Link>
        </div>
        <p className={styles.disclaimer} role="note">
          {t('sos.disclaimer')}
        </p>
      </header>

      {!profile.category && (
        <aside className={styles.gateCard} aria-labelledby="sos-profile-gate">
          <h2 id="sos-profile-gate" className={styles.gateTitle}>
            {t('sos.noCategoryTitle')}
          </h2>
          <p className={styles.gateDesc}>{t('sos.noCategoryDesc')}</p>
          <Link to="/onboarding" className={styles.gateCta}>
            {t('sos.startOnboarding')} →
          </Link>
        </aside>
      )}

      <section aria-labelledby="sos-vets" className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 id="sos-vets" className={styles.sectionTitle}>
            {t('sos.nearbyTitle')}
          </h2>
          {!hospitalsQuery.isLoading && !hospitalsQuery.isError && emergencyHospitals.fellBack && (
            <p className={styles.fallback}>{t('sos.noEmergency')}</p>
          )}
        </header>
        {hospitalsQuery.isLoading && (
          <p className={styles.loading} role="status">
            {t('common.loading')}
          </p>
        )}
        {hospitalsQuery.isError && (
          <EmptyState
            variant="discover"
            icon="⚠️"
            title={t('common.error')}
            description={t('common.loadErrorHint')}
          />
        )}
        {!hospitalsQuery.isLoading &&
          !hospitalsQuery.isError &&
          emergencyHospitals.primary.length === 0 && (
            <EmptyState variant="discover" icon="🏥" title={t('hospitals.noResult')} />
          )}
        {!hospitalsQuery.isError && emergencyHospitals.primary.length > 0 && (
          <ul className={styles.vetList}>
            {emergencyHospitals.primary.slice(0, 4).map((h, idx) => (
              <li key={h.id} className={styles.vetItem}>
                <div className={styles.vetRank} aria-hidden="true">
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className={styles.vetBody}>
                  <div className={styles.vetTopRow}>
                    <h3 className={styles.vetName}>{h.name}</h3>
                    {h.hasEmergency && (
                      <Badge variant="error">{t('hospitals.emergencyBadge')}</Badge>
                    )}
                  </div>
                  <p className={styles.vetMeta}>
                    {h.address}
                    {Number.isFinite(h.distanceKm) && ` · ${h.distanceKm}km`}
                  </p>
                  <p className={styles.vetHours}>{h.hours}</p>
                </div>
                <div className={styles.vetActions}>
                  <a
                    href={`tel:${h.phone}`}
                    className={styles.callLink}
                    aria-label={`${h.name}, ${t('sos.callNow')}, ${h.phone}`}
                  >
                    <span aria-hidden="true">☎</span>
                    <span>
                      {t('sos.callNow')}
                      <strong>{h.phone}</strong>
                    </span>
                  </a>
                  <a href={h.mapUrl} target="_blank" rel="noreferrer" className={styles.mapLink}>
                    {t('sos.openMap')} ↗
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
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
    </section>
  )
}

export default Sos
