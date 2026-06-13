import Badge from '@components/common/Badge'
import Card from '@components/common/Card'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import { cafeMemberCount, useCafesStore, type Cafe } from '@domains/cafes'
import { useOnboardingStore } from '@domains/onboarding'
import { SPECIES_CATEGORIES, type SpeciesCategory } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Cafes.module.css'

function Cafes() {
  const { t } = useTranslation()
  useDocumentTitle(t('cafes.title'))

  const profile = useOnboardingStore((s) => s.profile)
  const cafes = useCafesStore((s) => s.cafes)
  const postsMap = useCafesStore((s) => s.posts)
  const joinedCafeIds = useCafesStore((s) => s.joinedCafeIds)
  const ownCafeIds = useCafesStore((s) => s.ownCafeIds)
  const joinCafe = useCafesStore((s) => s.joinCafe)
  const leaveCafe = useCafesStore((s) => s.leaveCafe)

  const [category, setCategory] = useState<SpeciesCategory | 'all'>(profile.category ?? 'all')
  const [search, setSearch] = useState('')

  const needle = search.trim().toLowerCase()
  const visible = cafes.filter((cafe) => {
    if (cafe.archivedByAdmin) return false
    if (category !== 'all' && cafe.category !== category) return false
    if (!needle) return true
    return (
      cafe.name.toLowerCase().includes(needle) ||
      cafe.speciesName.toLowerCase().includes(needle) ||
      cafe.description.toLowerCase().includes(needle)
    )
  })
  const joined = visible.filter((c) => joinedCafeIds[c.id])
  const others = visible.filter((c) => !joinedCafeIds[c.id])

  function renderCafe(cafe: Cafe) {
    const isJoined = Boolean(joinedCafeIds[cafe.id])
    const postCount = (postsMap[cafe.id] ?? []).filter((p) => !p.hiddenByAdmin).length
    return (
      <li key={cafe.id}>
        <Card padding="md" className={styles.cafeCard}>
          <Card.Body>
            <div className={styles.cafeRow}>
              <span className={styles.cafeEmoji} aria-hidden="true">
                {cafe.emoji}
              </span>
              <div className={styles.cafeMeta}>
                <div className={styles.cafeTitleRow}>
                  <Link to={`/cafes/${cafe.id}`} className={styles.cafeName}>
                    {cafe.name}
                  </Link>
                  {ownCafeIds[cafe.id] && <Badge variant="primary">{t('cafes.myBadge')}</Badge>}
                </div>
                <p className={styles.cafeDesc}>{cafe.description}</p>
                <p className={styles.cafeStats}>
                  <Badge variant="default">{t(`categories.${cafe.category}`)}</Badge>{' '}
                  {cafe.speciesName} ·{' '}
                  {t('cafes.members', { count: cafeMemberCount(cafe, isJoined) })} ·{' '}
                  {t('cafes.postsCount', { count: postCount })}
                </p>
              </div>
              <div className={styles.cafeActions}>
                <Link to={`/cafes/${cafe.id}`} className={styles.enterLink}>
                  {t('cafes.open')}
                </Link>
                <button
                  type="button"
                  className={[styles.joinButton, isJoined ? styles.joinedButton : ''].join(' ')}
                  aria-pressed={isJoined}
                  onClick={() => (isJoined ? leaveCafe(cafe.id) : joinCafe(cafe.id))}
                >
                  {isJoined ? t('cafes.joined') : t('cafes.join')}
                </button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </li>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('cafes.title')}</h1>
          <p className={styles.subtitle}>{t('cafes.subtitle')}</p>
        </div>
        <Link to="/cafes/new" className={styles.createCta}>
          {t('cafes.createCta')}
        </Link>
      </header>

      <div className={styles.controls}>
        <Input
          type="search"
          aria-label={t('cafes.searchLabel')}
          placeholder={t('cafes.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div role="radiogroup" aria-label={t('cafes.filterLabel')} className={styles.filters}>
        <button
          type="button"
          role="radio"
          aria-checked={category === 'all'}
          className={[styles.filterChip, category === 'all' ? styles.filterActive : ''].join(' ')}
          onClick={() => setCategory('all')}
        >
          {t('cafes.filterAll')}
        </button>
        {SPECIES_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={category === c}
            className={[styles.filterChip, category === c ? styles.filterActive : ''].join(' ')}
            onClick={() => setCategory(c)}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <EmptyState
          variant="discover"
          icon="☕"
          title={needle ? t('cafes.noResult') : t('cafes.emptyTitle')}
          description={needle ? t('cafes.noResultHint') : t('cafes.emptyDesc')}
          action={
            <Link to="/cafes/new" className={styles.createCta}>
              {t('cafes.createCta')}
            </Link>
          }
        />
      )}

      {joined.length > 0 && (
        <section aria-labelledby="joined-cafes-heading" className={styles.group}>
          <h2 id="joined-cafes-heading" className={styles.groupTitle}>
            {t('cafes.joinedSection')}
          </h2>
          <ul className={styles.list}>{joined.map(renderCafe)}</ul>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="browse-cafes-heading" className={styles.group}>
          <h2 id="browse-cafes-heading" className={styles.groupTitle}>
            {t('cafes.browseSection')}
          </h2>
          <ul className={styles.list}>{others.map(renderCafe)}</ul>
        </section>
      )}
    </section>
  )
}

export default Cafes
