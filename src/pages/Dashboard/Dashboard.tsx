import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import { useAdoptionList } from '@features/adoption'
import { useCareGuide } from '@features/care-guides'
import { useCommunitiesList } from '@features/communities'
import {
  useExternalLinks,
  type SpeciesCategory as ExtSpeciesCategory,
} from '@features/external-links'
import { useFuneralList } from '@features/funeral'
import { useHospitalsList } from '@features/hospitals'
import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
import { useShopsList } from '@features/shops'
import { useSpecies } from '@features/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useAppStore } from '@store/index'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'

import styles from './Dashboard.module.css'

const LIFECYCLE_STAGES = [
  { id: 'pick', emoji: '✨', target: '/onboarding' },
  { id: 'adopt', emoji: '🤝', target: '/adoption' },
  { id: 'raise', emoji: '🏠', target: '/care' },
  { id: 'vet', emoji: '🏥', target: '/hospitals' },
  { id: 'daily', emoji: '🛒', target: '/shops' },
  { id: 'senior', emoji: '🪴', target: '/care' },
  { id: 'funeral', emoji: '🌈', target: '/funeral' },
] as const

function Dashboard() {
  const { t } = useTranslation()
  const profile = useOnboardingStore((s) => s.profile)
  const user = useAppStore((s) => s.user)
  useDocumentTitle(t('nav.dashboard'))

  const origin = useMemo(
    () => (profile.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined),
    [profile.location]
  )

  const { data: species } = useSpecies(profile.speciesId ?? undefined)
  const hospitalsQuery = useHospitalsList(
    profile.category ? { category: profile.category, origin } : { origin }
  )
  const shopsQuery = useShopsList(
    profile.category ? { category: profile.category, origin } : { origin }
  )
  const careQuery = useCareGuide(profile.speciesId ?? undefined)
  const communitiesQuery = useCommunitiesList(
    profile.category ? { category: profile.category } : {}
  )
  const adoptionQuery = useAdoptionList(profile.category ? { category: profile.category } : {})
  const funeralQuery = useFuneralList(profile.category ? { category: profile.category } : {})
  const externalLinksQuery = useExternalLinks(
    profile.category ? { speciesCategory: profile.category as ExtSpeciesCategory } : {}
  )

  if (!isOnboardingComplete(profile)) {
    return <Navigate to="/onboarding" replace />
  }

  const greetingName = user?.name ?? t('dashboard.guest')

  return (
    <section className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('dashboard.title', { name: greetingName })}</h1>
          <p className={styles.subtitle}>{t('dashboard.subtitle')}</p>
          {profile.location && (
            <p className={styles.locationNote}>
              {t('dashboard.locationNote', { label: profile.location.label })}
            </p>
          )}
        </div>
        {species && (
          <Card padding="md" className={styles.speciesCard}>
            <Card.Body>
              <div className={styles.speciesHeader}>
                <span aria-hidden="true" className={styles.heroEmoji}>
                  {species.heroEmoji}
                </span>
                <div>
                  <p className={styles.eyebrow}>{t('dashboard.selectedSpecies')}</p>
                  <h2 className={styles.speciesName}>{species.koreanName}</h2>
                  <p className={styles.scientific}>{species.scientificName}</p>
                </div>
              </div>
              <div className={styles.speciesBadges}>
                <Badge variant="primary">{t(`categories.${species.category}`)}</Badge>
                <Badge variant="default">{t(`difficulty.${species.difficulty}`)}</Badge>
              </div>
              <Link to="/onboarding" className={styles.speciesAction}>
                {t('dashboard.speciesChange')} →
              </Link>
            </Card.Body>
          </Card>
        )}
      </header>

      <section aria-labelledby="lifecycle-heading">
        <header className={styles.sectionHeader}>
          <h2 id="lifecycle-heading">{t('lifecycle.title')}</h2>
          <p className={styles.sectionSubtitle}>{t('lifecycle.subtitle')}</p>
        </header>
        <div className={styles.lifecycleGrid}>
          {LIFECYCLE_STAGES.map((stage) => (
            <Link key={stage.id} to={stage.target} className={styles.stageCardLink}>
              <Card hoverable padding="lg" className={styles.stageCard}>
                <Card.Body>
                  <span aria-hidden="true" className={styles.stageEmoji}>
                    {stage.emoji}
                  </span>
                  <h3 className={styles.stageTitle}>{t(`lifecycle.stages.${stage.id}`)}</h3>
                  <p className={styles.stageDesc}>{t(`lifecycle.stageDesc.${stage.id}`)}</p>
                  <span className={styles.stageCta}>{t('lifecycle.openStage')} →</span>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="hospitals-heading">
        <header className={styles.sectionHeader}>
          <h2 id="hospitals-heading">{t('dashboard.nearHospitalsTitle')}</h2>
          <Link to="/hospitals" className={styles.sectionLink}>
            {t('dashboard.viewAllHospitals')} →
          </Link>
        </header>
        {hospitalsQuery.isLoading && <Skeleton variant="rectangular" height={120} lines={2} />}
        {hospitalsQuery.data && hospitalsQuery.data.length === 0 && (
          <EmptyState icon="🏥" title={t('dashboard.emptyHospitals')} />
        )}
        <div className={styles.cardGrid}>
          {hospitalsQuery.data?.slice(0, 3).map((h) => (
            <Card key={h.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{h.name}</h3>
                <p className={styles.itemMeta}>
                  {h.district}
                  {Number.isFinite(h.distanceKm) && ` · ${h.distanceKm}km`}
                </p>
                <p className={styles.itemDesc}>{h.hours}</p>
                {h.hasEmergency && <Badge variant="error">{t('hospitals.emergencyBadge')}</Badge>}
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="shops-heading">
        <header className={styles.sectionHeader}>
          <h2 id="shops-heading">{t('dashboard.nearShopsTitle')}</h2>
          <Link to="/shops" className={styles.sectionLink}>
            {t('dashboard.viewAllShops')} →
          </Link>
        </header>
        {shopsQuery.isLoading && <Skeleton variant="rectangular" height={120} lines={2} />}
        {shopsQuery.data && shopsQuery.data.length === 0 && (
          <EmptyState icon="🛒" title={t('dashboard.emptyShops')} />
        )}
        <div className={styles.cardGrid}>
          {shopsQuery.data?.slice(0, 3).map((shop) => (
            <Card key={shop.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{shop.name}</h3>
                <p className={styles.itemMeta}>
                  {shop.district ?? t('shops.online')}
                  {shop.distanceKm !== null && ` · ${shop.distanceKm}km`}
                </p>
                <p className={styles.itemDesc}>{shop.notes}</p>
                <Badge variant="primary">{t(`shops.kind${capitalize(shop.kind)}`)}</Badge>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="care-heading">
        <header className={styles.sectionHeader}>
          <h2 id="care-heading">{t('dashboard.careGuideTitle')}</h2>
          <Link to="/care" className={styles.sectionLink}>
            {t('dashboard.viewCareGuide')} →
          </Link>
        </header>
        {careQuery.isLoading && <Skeleton variant="text" lines={3} />}
        {careQuery.data && (
          <Card padding="md">
            <Card.Body>
              <h3 className={styles.itemTitle}>{careQuery.data.sections[0]?.title}</h3>
              <p className={styles.itemDesc}>{careQuery.data.sections[0]?.body}</p>
            </Card.Body>
          </Card>
        )}
        {!careQuery.isLoading && !careQuery.data && (
          <EmptyState icon="📝" title={t('care.notFound')} />
        )}
      </section>

      <section className={styles.gridSection} aria-labelledby="communities-heading">
        <header className={styles.sectionHeader}>
          <h2 id="communities-heading">{t('dashboard.communitiesTitle')}</h2>
          <Link to="/communities" className={styles.sectionLink}>
            {t('dashboard.viewCommunities')} →
          </Link>
        </header>
        {communitiesQuery.isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        <div className={styles.cardGrid}>
          {communitiesQuery.data?.slice(0, 3).map((c) => (
            <Card key={c.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{c.name}</h3>
                <Badge variant="default">{t(`communities.kind${capitalize(c.kind)}`)}</Badge>
                <p className={styles.itemDesc}>{c.memberHint ?? c.language.toUpperCase()}</p>
                <a className={styles.externalLink} href={c.url} target="_blank" rel="noreferrer">
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="adoption-heading">
        <header className={styles.sectionHeader}>
          <h2 id="adoption-heading">{t('dashboard.adoptionTitle')}</h2>
          <Link to="/adoption" className={styles.sectionLink}>
            {t('dashboard.viewAdoption')} →
          </Link>
        </header>
        <div className={styles.cardGrid}>
          {adoptionQuery.data?.slice(0, 3).map((a) => (
            <Card key={a.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{a.name}</h3>
                <p className={styles.itemMeta}>
                  {a.region} ·{' '}
                  <Badge variant="default">{t(`adoption.kind${capitalize(a.kind)}`)}</Badge>
                </p>
                <p className={styles.itemDesc}>{a.description}</p>
                <a className={styles.externalLink} href={a.url} target="_blank" rel="noreferrer">
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="funeral-heading">
        <header className={styles.sectionHeader}>
          <h2 id="funeral-heading">{t('dashboard.funeralTitle')}</h2>
          <Link to="/funeral" className={styles.sectionLink}>
            {t('dashboard.viewFuneral')} →
          </Link>
        </header>
        <div className={styles.cardGrid}>
          {funeralQuery.data?.slice(0, 3).map((f) => (
            <Card key={f.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{f.name}</h3>
                <p className={styles.itemMeta}>{f.region}</p>
                <p className={styles.itemDesc}>{f.description}</p>
                {f.certified ? (
                  <Badge variant="success">{t('funeral.certified')}</Badge>
                ) : (
                  <Badge variant="warning">{t('funeral.uncertified')}</Badge>
                )}{' '}
                <a className={styles.externalLink} href={f.url} target="_blank" rel="noreferrer">
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.gridSection} aria-labelledby="external-heading">
        <header className={styles.sectionHeader}>
          <h2 id="external-heading">{t('dashboard.externalTitle')}</h2>
          <Link to="/resources" className={styles.sectionLink}>
            {t('nav.resources')} →
          </Link>
        </header>
        {externalLinksQuery.isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        <div className={styles.cardGrid}>
          {externalLinksQuery.data?.slice(0, 4).map((link) => (
            <Card key={link.id} padding="md">
              <Card.Body>
                <h3 className={styles.itemTitle}>{link.name}</h3>
                <p className={styles.itemMeta}>
                  <Badge variant="default">{t(`resources.categories.${link.category}`)}</Badge>
                  {link.badge && (
                    <>
                      {' '}
                      <Badge variant="success">{link.badge}</Badge>
                    </>
                  )}
                </p>
                <p className={styles.itemDesc}>{link.description}</p>
                <a className={styles.externalLink} href={link.url} target="_blank" rel="noreferrer">
                  {t('common.openLink')} ↗
                </a>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <div className={styles.footerActions}>
        <Button variant="ghost" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          ↑ Top
        </Button>
      </div>
    </section>
  )
}

function capitalize<T extends string>(value: T): Capitalize<T> {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as Capitalize<T>
}

export default Dashboard
