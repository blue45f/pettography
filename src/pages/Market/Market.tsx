import Badge from '@components/common/Badge'
import Button from '@components/common/Button'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Select from '@components/common/Select'
import Switch from '@components/common/Switch'
import Textarea from '@components/common/Textarea'
import { useToast } from '@components/common/Toast'
import {
  CB_STATUSES,
  listingFormSchema,
  MARKET_REGIONS,
  MARKET_SORT_OPTIONS,
  priceSortKey,
  SEED_LISTINGS,
  useMarketStore,
  type Listing,
  type ListingFormValues,
  type MarketRegion,
  type MarketSort,
} from '@domains/market'
import { useOnboardingStore } from '@domains/onboarding'
import {
  SPECIES_CATEGORIES,
  useSpeciesList,
  type Species,
  type SpeciesCategory,
} from '@domains/species'
import { zodResolver } from '@hookform/resolvers/zod'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Market.module.css'

export const MARKET_LISTING_DRAFT_KEY = 'pettography.market.listingDraft'

const MARKET_DRAFT_SAVE_DELAY_MS = 500

function isExternalContact(contact: string): boolean {
  return /^https?:\/\//i.test(contact.trim())
}

function formatPrice(priceKrw: number): string {
  return new Intl.NumberFormat('ko-KR').format(priceKrw)
}

function createDefaultListingValues(lastAuthor = ''): ListingFormValues {
  return {
    title: '',
    speciesId: null,
    morph: '',
    region: 'songpa',
    cbStatus: 'cb',
    isFree: false,
    priceKrw: null,
    contact: '',
    description: '',
    author: lastAuthor,
  }
}

function readSavedListingDraft(defaultValues: ListingFormValues): ListingFormValues | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = globalThis.localStorage.getItem(MARKET_LISTING_DRAFT_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<ListingFormValues>
    return {
      ...defaultValues,
      title: readString(parsed.title),
      speciesId: typeof parsed.speciesId === 'string' && parsed.speciesId ? parsed.speciesId : null,
      morph: readString(parsed.morph),
      region: isMarketRegion(parsed.region) ? parsed.region : defaultValues.region,
      cbStatus: isCbStatus(parsed.cbStatus) ? parsed.cbStatus : defaultValues.cbStatus,
      isFree: typeof parsed.isFree === 'boolean' ? parsed.isFree : defaultValues.isFree,
      priceKrw: readPrice(parsed.priceKrw),
      contact: readString(parsed.contact),
      description: readString(parsed.description),
      author: readString(parsed.author) || defaultValues.author,
    }
  } catch {
    return null
  }
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readPrice(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null
}

function isMarketRegion(value: unknown): value is MarketRegion {
  return typeof value === 'string' && MARKET_REGIONS.includes(value as MarketRegion)
}

function isCbStatus(value: unknown): value is (typeof CB_STATUSES)[number] {
  return typeof value === 'string' && CB_STATUSES.includes(value as (typeof CB_STATUSES)[number])
}

function hasMeaningfulDraft(values: Partial<ListingFormValues>): boolean {
  return Boolean(
    values.title?.trim() ||
    values.speciesId ||
    values.morph?.trim() ||
    values.contact?.trim() ||
    values.description?.trim() ||
    values.isFree ||
    values.priceKrw != null
  )
}

function persistListingDraft(values: Partial<ListingFormValues>): void {
  if (typeof window === 'undefined') return

  try {
    if (!hasMeaningfulDraft(values)) {
      globalThis.localStorage.removeItem(MARKET_LISTING_DRAFT_KEY)
      return
    }
    globalThis.localStorage.setItem(MARKET_LISTING_DRAFT_KEY, JSON.stringify(values))
  } catch {
    /* localStorage quota/private mode: draft save is best-effort. */
  }
}

function clearListingDraft(): void {
  if (typeof window === 'undefined') return

  try {
    globalThis.localStorage.removeItem(MARKET_LISTING_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

function Market() {
  const { t } = useTranslation()
  const { toast } = useToast()
  useDocumentTitle(t('market.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const { data: species = [] } = useSpeciesList({})

  const listings = useMarketStore((s) => s.listings)
  const ownIds = useMarketStore((s) => s.ownIds)
  const lastAuthor = useMarketStore((s) => s.lastAuthor)
  const removeListing = useMarketStore((s) => s.removeListing)
  const hydrateSeed = useMarketStore((s) => s.hydrateSeed)

  // Seed once via a lazy initializer (never setState-in-effect).
  useState(() => {
    hydrateSeed(SEED_LISTINGS)
    return true
  })

  const speciesById = useMemo(() => {
    const map = new Map<string, Species>()
    for (const sp of species) map.set(sp.id, sp)
    return map
  }, [species])

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [region, setRegion] = useState<MarketRegion | 'all'>('all')
  const [freeOnly, setFreeOnly] = useState(false)
  const [sort, setSort] = useState<MarketSort>('recent')

  const visibleListings = useMemo(
    () => selectListings(listings, { category, region, freeOnly, sort }),
    [listings, category, region, freeOnly, sort]
  )

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('market.title')}</h1>
        <p className={styles.subtitle}>{t('market.subtitle')}</p>
      </header>

      <Card padding="lg" className={styles.safetyCard}>
        <Card.Body>
          <h2 className={styles.safetyTitle}>
            <span aria-hidden="true">🛡️</span> {t('market.safety.title')}
          </h2>
          <ul className={styles.safetyList}>
            <li>{t('market.safety.cb')}</li>
            <li>{t('market.safety.meet')}</li>
            <li>{t('market.safety.free')}</li>
          </ul>
          <p className={styles.safetyNote}>
            {t('market.safety.regulatedNote')}{' '}
            <Link to="/registry" className={styles.safetyLink}>
              {t('market.safety.regulatedLink')}
            </Link>
          </p>
        </Card.Body>
      </Card>

      <div className={styles.controls}>
        <div
          role="radiogroup"
          aria-label={t('market.filterCategoryLabel')}
          className={styles.filters}
        >
          <FilterChip
            active={category === 'all'}
            label={t('market.filterAll')}
            onClick={() => setCategory('all')}
          />
          {SPECIES_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              label={t(`categories.${c}`)}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>

        <div
          role="radiogroup"
          aria-label={t('market.filterRegionLabel')}
          className={styles.filters}
        >
          <FilterChip
            active={region === 'all'}
            label={t('market.filterAll')}
            onClick={() => setRegion('all')}
          />
          {MARKET_REGIONS.map((r) => (
            <FilterChip
              key={r}
              active={region === r}
              label={t(`market.regions.${r}`)}
              onClick={() => setRegion(r)}
            />
          ))}
        </div>

        <div className={styles.controlsRow}>
          <Switch checked={freeOnly} onChange={setFreeOnly} label={t('market.freeOnly')} />
          <Select
            aria-label={t('market.sortLabel')}
            value={sort}
            onChange={(e) => setSort(e.target.value as MarketSort)}
            options={MARKET_SORT_OPTIONS.map((s) => ({
              value: s,
              label: t(`market.sort.${s}`),
            }))}
          />
        </div>
      </div>

      <ListingComposer lastAuthor={lastAuthor} species={species} />

      {visibleListings.length === 0 ? (
        <EmptyState
          variant="discover"
          icon="🪧"
          title={t('market.empty')}
          description={t('market.emptyHint')}
        />
      ) : (
        <ul className={styles.grid}>
          {visibleListings.map((listing) => (
            <li key={listing.id}>
              <ListingCard
                listing={listing}
                species={listing.speciesId ? speciesById.get(listing.speciesId) : undefined}
                isOwn={Boolean(ownIds[listing.id])}
                onRemove={() => {
                  removeListing(listing.id)
                  toast(t('market.removedToast'), 'success')
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface FilterChipProps {
  active: boolean
  label: string
  onClick: () => void
}

function FilterChip({ active, label, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      className={[styles.filterChip, active ? styles.filterActive : ''].join(' ')}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

interface ListingCardProps {
  listing: Listing
  species: Species | undefined
  isOwn: boolean
  onRemove: () => void
}

function ListingCard({ listing, species, isOwn, onRemove }: ListingCardProps) {
  const { t } = useTranslation()
  const isRegulated = species?.filingStatus === 'regulated'
  const external = isExternalContact(listing.contact)

  return (
    <Card padding="md" className={styles.listingCard}>
      <Card.Body>
        <div className={styles.listingTop}>
          <h3 className={styles.listingTitle}>{listing.title}</h3>
          {listing.isFree ? (
            <Badge variant="success">{t('market.free')}</Badge>
          ) : (
            <span className={styles.price}>
              {t('market.priceWon', { price: formatPrice(listing.priceKrw ?? 0) })}
            </span>
          )}
        </div>

        <p className={styles.listingSpecies}>
          {species ? (
            <>
              <span aria-hidden="true">{species.heroEmoji}</span> {species.koreanName}
            </>
          ) : (
            t('market.unknownSpecies')
          )}
          {listing.morph ? <span className={styles.morph}> · {listing.morph}</span> : null}
        </p>

        <div className={styles.badges}>
          <Badge variant="default">{t(`market.regions.${listing.region}`)}</Badge>
          <Badge variant={listing.cbStatus === 'cb' ? 'primary' : 'default'}>
            {t(`market.cb.${listing.cbStatus}`)}
          </Badge>
          {isRegulated && (
            <Link to="/registry" className={styles.regulatedLink}>
              <Badge variant="warning">{t('market.regulatedBadge')}</Badge>
            </Link>
          )}
        </div>

        <p className={styles.description}>{listing.description}</p>

        <div className={styles.listingFooter}>
          <p className={styles.contact}>
            <span className={styles.contactLabel}>{t('market.contactLabel')}</span>{' '}
            {external ? (
              <a
                href={listing.contact}
                target="_blank"
                rel="noreferrer"
                className={styles.contactLink}
              >
                {listing.contact} <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className={styles.contactText}>{listing.contact}</span>
            )}
          </p>
          <span className={styles.author}>
            {listing.author} · {new Date(listing.createdAt).toLocaleDateString('ko')}
          </span>
        </div>

        {isOwn && (
          <div className={styles.ownActions}>
            <button type="button" className={styles.dangerLink} onClick={onRemove}>
              {t('market.remove')}
            </button>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

interface ListingComposerProps {
  lastAuthor: string
  species: Species[]
}

function ListingComposer({ lastAuthor, species }: ListingComposerProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const addListing = useMarketStore((s) => s.addListing)
  const [previewCreatedAt] = useState(() => new Date().toISOString())
  const [initialDraft] = useState(() => {
    const defaults = createDefaultListingValues(lastAuthor)
    const saved = readSavedListingDraft(defaults)
    return {
      values: saved ?? defaults,
      restored: Boolean(saved),
    }
  })
  const [formValues, setFormValues] = useState(initialDraft.values)
  const [formKey, setFormKey] = useState(0)
  const [draftRestored, setDraftRestored] = useState(initialDraft.restored)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: initialDraft.values,
    values: formValues,
  })

  useEffect(() => {
    if (lastAuthor && !dirtyFields.author) setValue('author', lastAuthor)
  }, [lastAuthor, dirtyFields.author, setValue])

  const [
    previewTitle = '',
    previewSpeciesId = null,
    previewMorph = '',
    previewRegion = 'songpa',
    previewCbStatus = 'cb',
    isFree = false,
    previewPriceKrw = null,
    previewContact = '',
    previewDescription = '',
    previewAuthor = '',
  ] = useWatch({
    control,
    name: [
      'title',
      'speciesId',
      'morph',
      'region',
      'cbStatus',
      'isFree',
      'priceKrw',
      'contact',
      'description',
      'author',
    ],
  })

  const draftValues = useMemo<ListingFormValues>(
    () => ({
      title: previewTitle,
      speciesId: previewSpeciesId,
      morph: previewMorph,
      region: previewRegion,
      cbStatus: previewCbStatus,
      isFree,
      priceKrw: previewPriceKrw,
      contact: previewContact,
      description: previewDescription,
      author: previewAuthor,
    }),
    [
      previewTitle,
      previewSpeciesId,
      previewMorph,
      previewRegion,
      previewCbStatus,
      isFree,
      previewPriceKrw,
      previewContact,
      previewDescription,
      previewAuthor,
    ]
  )

  useEffect(() => {
    const timerId = globalThis.setTimeout(
      () => persistListingDraft(draftValues),
      MARKET_DRAFT_SAVE_DELAY_MS
    )
    return () => globalThis.clearTimeout(timerId)
  }, [draftValues])

  const speciesOptions = useMemo(
    () => [
      { value: '', label: t('market.speciesUnselected') },
      ...species.map((sp) => ({ value: sp.id, label: `${sp.heroEmoji} ${sp.koreanName}` })),
    ],
    [species, t]
  )

  const selectedSpecies = useMemo(
    () => species.find((sp) => sp.id === previewSpeciesId),
    [species, previewSpeciesId]
  )

  const previewListing = useMemo<Listing>(
    () => ({
      id: 'market-preview',
      author: previewAuthor.trim() || t('market.preview.authorPlaceholder'),
      title: previewTitle.trim() || t('market.preview.titlePlaceholder'),
      speciesId: previewSpeciesId || null,
      category: selectedSpecies?.category ?? null,
      morph: previewMorph.trim(),
      isFree,
      priceKrw: isFree ? null : previewPriceKrw,
      region: previewRegion,
      cbStatus: previewCbStatus,
      contact: previewContact.trim() || t('market.contactPlaceholder'),
      description: previewDescription.trim() || t('market.preview.descriptionPlaceholder'),
      createdAt: previewCreatedAt,
    }),
    [
      previewAuthor,
      previewTitle,
      previewSpeciesId,
      selectedSpecies?.category,
      previewMorph,
      isFree,
      previewPriceKrw,
      previewRegion,
      previewCbStatus,
      previewContact,
      previewDescription,
      previewCreatedAt,
      t,
    ]
  )

  function replaceFormValues(values: ListingFormValues) {
    setFormValues(values)
    reset(values)
    setFormKey((key) => key + 1)
  }

  function discardDraft() {
    const defaults = createDefaultListingValues(lastAuthor)
    clearListingDraft()
    replaceFormValues(defaults)
    setDraftRestored(false)
  }

  const onSubmit = handleSubmit((values) => {
    const speciesId = values.speciesId || null
    const category = speciesId
      ? (species.find((sp) => sp.id === speciesId)?.category ?? null)
      : null
    addListing({
      author: values.author,
      title: values.title,
      speciesId,
      category,
      morph: values.morph,
      isFree: values.isFree,
      priceKrw: values.isFree ? null : values.priceKrw,
      region: values.region,
      cbStatus: values.cbStatus,
      contact: values.contact,
      description: values.description,
    })
    toast(t('market.postedToast'), 'success')
    clearListingDraft()
    setDraftRestored(false)
    replaceFormValues({
      title: '',
      speciesId: null,
      morph: '',
      region: values.region,
      cbStatus: values.cbStatus,
      isFree: false,
      priceKrw: null,
      contact: '',
      description: '',
      author: values.author,
    })
  })

  return (
    <div className={styles.composerGrid}>
      <Card padding="lg" className={styles.composerCard}>
        <Card.Body>
          <div className={styles.composerHeader}>
            <h2 className={styles.composerTitle}>{t('market.newListingTitle')}</h2>
            {draftRestored && (
              <div className={styles.draftNotice} role="status">
                <span>{t('market.draftRestored')}</span>
                <button type="button" className={styles.draftButton} onClick={discardDraft}>
                  {t('market.discardDraft')}
                </button>
              </div>
            )}
          </div>

          <form key={formKey} onSubmit={onSubmit} className={styles.composerForm} noValidate>
            <Input
              label={t('market.titleLabel')}
              placeholder={t('market.titlePlaceholder')}
              error={errors.title?.message ? t(errors.title.message) : undefined}
              {...register('title')}
            />

            <div className={styles.composerRow}>
              <Select
                label={t('market.species')}
                options={speciesOptions}
                {...register('speciesId')}
              />
              <Input
                label={t('market.morphLabel')}
                placeholder={t('market.morphPlaceholder')}
                error={errors.morph?.message ? t(errors.morph.message) : undefined}
                {...register('morph')}
              />
            </div>

            <div className={styles.composerRow}>
              <Select
                label={t('market.regionLabel')}
                options={MARKET_REGIONS.map((r) => ({
                  value: r,
                  label: t(`market.regions.${r}`),
                }))}
                {...register('region')}
              />
              <Select
                label={t('market.cbLabel')}
                options={CB_STATUSES.map((c) => ({ value: c, label: t(`market.cb.${c}`) }))}
                {...register('cbStatus')}
              />
            </div>

            <div className={styles.freeRow}>
              <Controller
                control={control}
                name="isFree"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={(checked) => {
                      field.onChange(checked)
                      if (checked) setValue('priceKrw', null, { shouldValidate: true })
                    }}
                    label={t('market.freeToggle')}
                  />
                )}
              />
              {!isFree && (
                <Controller
                  control={control}
                  name="priceKrw"
                  render={({ field }) => (
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      label={t('market.priceLabel')}
                      placeholder={t('market.pricePlaceholder')}
                      error={errors.priceKrw?.message ? t(errors.priceKrw.message) : undefined}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value
                        field.onChange(raw === '' ? null : Number(raw))
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  )}
                />
              )}
            </div>
            {isFree && <p className={styles.freeHint}>{t('market.freeHint')}</p>}

            <Input
              label={t('market.contactLabel')}
              placeholder={t('market.contactPlaceholder')}
              helperText={t('market.contactHelper')}
              error={errors.contact?.message ? t(errors.contact.message) : undefined}
              {...register('contact')}
            />

            <Textarea
              label={t('market.descriptionLabel')}
              rows={3}
              placeholder={t('market.descriptionPlaceholder')}
              error={errors.description?.message ? t(errors.description.message) : undefined}
              {...register('description')}
            />

            <Input
              label={t('market.author')}
              placeholder={t('market.authorPlaceholder')}
              error={errors.author?.message ? t(errors.author.message) : undefined}
              {...register('author')}
            />

            <div className={styles.composerActions}>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {t('market.publish')}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>

      <aside className={styles.previewPanel} role="region" aria-label={t('market.preview.title')}>
        <h2 className={styles.previewTitle}>{t('market.preview.title')}</h2>
        <ListingCard
          listing={previewListing}
          species={selectedSpecies}
          isOwn={false}
          onRemove={() => {}}
        />
      </aside>
    </div>
  )
}

interface SelectListingsOptions {
  category: SpeciesCategory | 'all'
  region: MarketRegion | 'all'
  freeOnly: boolean
  sort: MarketSort
}

function selectListings(listings: Listing[], options: SelectListingsOptions): Listing[] {
  const { category, region, freeOnly, sort } = options
  const filtered = listings.filter((l) => {
    if (category !== 'all' && l.category !== category) return false
    if (region !== 'all' && l.region !== region) return false
    if (freeOnly && !l.isFree) return false
    return true
  })
  return filtered.sort((a, b) => {
    if (sort === 'priceAsc') {
      const diff = priceSortKey(a) - priceSortKey(b)
      if (diff !== 0) return diff
      return b.createdAt.localeCompare(a.createdAt)
    }
    return b.createdAt.localeCompare(a.createdAt)
  })
}

export default Market
