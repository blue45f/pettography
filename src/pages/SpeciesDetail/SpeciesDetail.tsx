import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import ContentImage from '@components/common/ContentImage'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import PetBadge from '@components/common/PetBadge'
import ShareButton from '@components/common/ShareButton'
import Skeleton from '@components/common/Skeleton'
import { useToast } from '@components/common/Toast'
import {
  photoInputSchema,
  useActivePetPhotos,
  useGalleryStore,
  type PhotoInput,
} from '@domains/gallery'
import { useHospitalsList } from '@domains/hospitals'
import { useOnboardingStore } from '@domains/onboarding'
import { useShopsList } from '@domains/shops'
import { useSpecies, useSpeciesList } from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router'

import styles from './SpeciesDetail.module.css'

/** Only http(s) links are safe to render as an href; blocks javascript:/data: schemes. */
function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim())
}

function SpeciesDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const params = useParams<{ idOrSlug: string }>()
  const profile = useOnboardingStore((s) => s.profile)
  const setCategory = useOnboardingStore((s) => s.setCategory)
  const setSpecies = useOnboardingStore((s) => s.setSpecies)
  const complete = useOnboardingStore((s) => s.complete)

  const { data: species, isLoading } = useSpecies(params.idOrSlug)
  useDocumentTitle(species?.koreanName ?? t('common.appName'))

  const origin = useMemo(
    () => (profile.location ? { lat: profile.location.lat, lng: profile.location.lng } : undefined),
    [profile.location]
  )

  const hospitalsQuery = useHospitalsList(
    species ? { category: species.category, origin } : { origin }
  )
  const shopsQuery = useShopsList(species ? { category: species.category, origin } : { origin })
  const siblingsQuery = useSpeciesList(species ? { category: species.category } : {})

  const speciesPhotos = useActivePetPhotos(species?.id ?? null)
  const addPhoto = useGalleryStore((s) => s.addPhoto)
  const removePhoto = useGalleryStore((s) => s.removePhoto)

  const photoForm = useForm<PhotoInput>({
    resolver: zodResolver(photoInputSchema),
    defaultValues: { imageUrl: '', sourceUrl: '', caption: '' },
  })

  const onAddPhoto = photoForm.handleSubmit((values) => {
    if (!species) return
    addPhoto(species.id, values)
    toast(t('species.gallery.addedToast'), 'success')
    photoForm.reset({ imageUrl: '', sourceUrl: '', caption: '' })
  })

  if (isLoading) return <Skeleton variant="rectangular" height={200} lines={3} />
  if (!species) return <EmptyState icon="🐾" title={t('care.notFound')} />

  function handlePick() {
    if (!species) return
    setCategory(species.category)
    setSpecies(species.id)
    complete()
    toast(t('onboarding.finish'), 'success')
    navigate('/dashboard')
  }

  const siblings = siblingsQuery.data?.filter((s) => s.id !== species.id) ?? []
  // Canonical, human-readable share target — slug-based so the link survives
  // id changes and reads cleanly when pasted. Falls back to the current href.
  const shareUrl =
    typeof location !== 'undefined'
      ? `${location.origin}/species/${species.slug}`
      : `/species/${species.slug}`

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <span aria-hidden="true" className={styles.emoji}>
          {species.heroEmoji}
        </span>
        <div>
          <h1 className={styles.title}>{species.koreanName}</h1>
          <p className={styles.scientific}>{species.scientificName}</p>
          <div className={styles.badges}>
            <Badge variant="primary">{t(`categories.${species.category}`)}</Badge>
            <Badge variant="default">{t(`difficulty.${species.difficulty}`)}</Badge>
            <Badge variant="success">
              {t('care.lifespanYears', {
                min: species.lifespanMinYears,
                max: species.lifespanMaxYears,
              })}
            </Badge>
            {species.filingStatus && (
              <Badge
                variant={
                  species.filingStatus === 'regulated'
                    ? 'warning'
                    : species.filingStatus === 'white-list'
                      ? 'success'
                      : 'default'
                }
              >
                {t(`registry.filingStatus.${species.filingStatus}`)}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <Card padding="lg">
        <Card.Body>
          <p>{species.summary}</p>
          <dl className={styles.dl}>
            <div>
              <dt>{t('care.environment')}</dt>
              <dd>{species.environment}</dd>
            </div>
            <div>
              <dt>{t('care.diet')}</dt>
              <dd>{species.diet}</dd>
            </div>
          </dl>
          <div className={styles.tagRow}>
            {species.tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        </Card.Body>
      </Card>

      <div className={styles.actions}>
        <Button variant="primary" size="lg" onClick={handlePick}>
          {t('species.selectThis')}
        </Button>
        <Link to={`/care/${species.id}`} className={styles.secondaryLink}>
          {t('care.title')} →
        </Link>
        <ShareButton
          variant="outline"
          title={`${species.koreanName} · ${t('common.appName')}`}
          text={species.summary}
          url={shareUrl}
        >
          {t('species.shareSpecies')}
        </ShareButton>
      </div>

      <section aria-labelledby="related-hospitals-heading" className={styles.relatedSection}>
        <header className={styles.sectionHeader}>
          <h2 id="related-hospitals-heading">{t('species.relatedHospitalsTitle')}</h2>
          <Link to="/hospitals" className={styles.sectionLink}>
            {t('dashboard.viewAllHospitals')} →
          </Link>
        </header>
        {hospitalsQuery.isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        {hospitalsQuery.data && hospitalsQuery.data.length === 0 && (
          <EmptyState icon="🏥" title={t('species.noRelatedHospitals')} />
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

      <section aria-labelledby="related-shops-heading" className={styles.relatedSection}>
        <header className={styles.sectionHeader}>
          <h2 id="related-shops-heading">{t('species.relatedShopsTitle')}</h2>
          <Link to="/shops" className={styles.sectionLink}>
            {t('dashboard.viewAllShops')} →
          </Link>
        </header>
        {shopsQuery.isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        {shopsQuery.data && shopsQuery.data.length === 0 && (
          <EmptyState icon="🛒" title={t('species.noRelatedShops')} />
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
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="gallery-heading" className={styles.relatedSection}>
        <header className={styles.sectionHeader}>
          <h2 id="gallery-heading">{t('species.gallery.title', { name: species.koreanName })}</h2>
          <p className={styles.sectionSubtitle}>{t('species.gallery.subtitle')}</p>
        </header>

        <form className={styles.galleryForm} onSubmit={onAddPhoto} noValidate>
          <Input
            label={t('species.gallery.imageUrlLabel')}
            placeholder="https://…"
            error={photoForm.formState.errors.imageUrl?.message}
            {...photoForm.register('imageUrl')}
          />
          <Input
            label={t('species.gallery.sourceUrlLabel')}
            placeholder="https://instagram.com/…"
            error={photoForm.formState.errors.sourceUrl?.message}
            {...photoForm.register('sourceUrl')}
          />
          <Input
            label={t('species.gallery.captionLabel')}
            placeholder={t('species.gallery.captionPlaceholder')}
            maxLength={120}
            error={photoForm.formState.errors.caption?.message}
            {...photoForm.register('caption')}
          />
          <div className={styles.galleryFormActions}>
            <Button type="submit" variant="primary">
              {t('species.gallery.add')}
            </Button>
          </div>
        </form>

        {speciesPhotos.length === 0 ? (
          <EmptyState icon="📷" title={t('species.gallery.empty')} />
        ) : (
          <ul className={styles.galleryGrid}>
            {speciesPhotos.map((p) => (
              <li key={p.id} className={styles.galleryItem}>
                <ContentImage
                  src={p.imageUrl}
                  alt={p.caption ?? species.koreanName}
                  className={styles.galleryImage}
                />
                <div className={styles.galleryMeta}>
                  {p.caption && <p className={styles.galleryCaption}>{p.caption}</p>}
                  <PetBadge petId={p.petId} hideWhenActive />
                  <div className={styles.galleryFooter}>
                    {p.sourceUrl && isHttpUrl(p.sourceUrl) ? (
                      <a
                        className={styles.gallerySource}
                        href={p.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('species.gallery.source')} ↗
                      </a>
                    ) : (
                      <span className={styles.gallerySourceMuted}>
                        {t('species.gallery.noSource')}
                      </span>
                    )}
                    <button
                      type="button"
                      className={styles.galleryRemove}
                      onClick={() => removePhoto(p.id)}
                      aria-label={t('species.gallery.remove')}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="related-species-heading" className={styles.relatedSection}>
        <header className={styles.sectionHeader}>
          <h2 id="related-species-heading">{t('species.relatedSpeciesTitle')}</h2>
        </header>
        {siblingsQuery.isLoading && <Skeleton variant="rectangular" height={80} lines={2} />}
        {!siblingsQuery.isLoading && siblings.length === 0 && (
          <EmptyState icon="🐾" title={t('species.noRelatedSpecies')} />
        )}
        <div className={styles.cardGrid}>
          {siblings.slice(0, 4).map((s) => (
            <Link key={s.id} to={`/species/${s.slug}`} className={styles.siblingCardLink}>
              <Card padding="md" hoverable>
                <Card.Body>
                  <div className={styles.siblingHeader}>
                    <span aria-hidden="true" className={styles.siblingEmoji}>
                      {s.heroEmoji}
                    </span>
                    <div>
                      <h3 className={styles.itemTitle}>{s.koreanName}</h3>
                      <p className={styles.scientific}>{s.scientificName}</p>
                    </div>
                  </div>
                  <div className={styles.badges}>
                    <Badge variant="default">{t(`difficulty.${s.difficulty}`)}</Badge>
                  </div>
                </Card.Body>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}

export default SpeciesDetail
