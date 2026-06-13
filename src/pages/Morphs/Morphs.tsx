import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import { MORPHS, MORPH_BREEDERS, type Morph } from '@domains/morphs'
import { useSpeciesList } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Morphs.module.css'

function Morphs() {
  const { t } = useTranslation()
  useDocumentTitle(t('morphs.title'))

  const { data: allSpecies = [] } = useSpeciesList({})
  const availableSpecies = useMemo(() => {
    const slugs = new Set(MORPHS.map((m) => m.speciesSlug))
    return allSpecies.filter((s) => slugs.has(s.slug))
  }, [allSpecies])

  const [selectedSlug, setSelectedSlug] = useState<string | null>(availableSpecies[0]?.slug ?? null)

  const morphs = useMemo(() => MORPHS.filter((m) => m.speciesSlug === selectedSlug), [selectedSlug])
  const selectedSpecies = useMemo(
    () => availableSpecies.find((s) => s.slug === selectedSlug),
    [availableSpecies, selectedSlug],
  )

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('morphs.title')}</h1>
        <p className={styles.subtitle}>{t('morphs.subtitle')}</p>
      </header>

      <nav className={styles.speciesNav} aria-label={t('morphs.pickSpecies')}>
        {availableSpecies.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelectedSlug(s.slug)}
            className={[styles.speciesChip, selectedSlug === s.slug ? styles.speciesActive : '']
              .filter(Boolean)
              .join(' ')}
          >
            <span aria-hidden="true">{s.heroEmoji}</span>
            <span>{s.koreanName}</span>
          </button>
        ))}
      </nav>

      {!selectedSpecies ? (
        <EmptyState icon="🎨" title={t('morphs.empty')} />
      ) : (
        <>
          {selectedSpecies && (
            <p className={styles.contextLine}>
              <Link to={`/species/${selectedSpecies.slug}`} className={styles.contextLink}>
                {selectedSpecies.koreanName} {t('morphs.openDetail')} →
              </Link>
            </p>
          )}

          <ul className={styles.morphGrid}>
            {morphs.map((m) => (
              <MorphCard key={m.id} morph={m} t={t} />
            ))}
          </ul>

          <section className={styles.breederSection} aria-labelledby="breeders-heading">
            <h2 id="breeders-heading" className={styles.sectionTitle}>
              {t('morphs.breedersTitle')}
            </h2>
            <ul className={styles.breederList}>
              {MORPH_BREEDERS.map((b) => (
                <li key={b.id}>
                  <a className={styles.breederLink} href={b.url} target="_blank" rel="noreferrer">
                    <strong>{b.name}</strong>
                    <span className={styles.breederTag}>{b.tag}</span>
                    <span className={styles.breederArrow}>↗</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.disclaimer}>{t('morphs.disclaimer')}</p>
          </section>
        </>
      )}
    </section>
  )
}

function MorphCard({ morph, t }: { morph: Morph; t: (k: string) => string }) {
  return (
    <li className={styles.morphCard}>
      <header className={styles.morphHeader}>
        <h3 className={styles.morphName}>{morph.name}</h3>
        <Badge
          variant={
            morph.rarity === 'rare' ? 'warning' : morph.rarity === 'mid' ? 'primary' : 'default'
          }
        >
          {t(`morphs.rarity.${morph.rarity}`)}
        </Badge>
      </header>
      <p className={styles.morphDesc}>{morph.description}</p>
      <p className={styles.morphPrice}>
        ₩{morph.approxPriceMinKrw.toLocaleString('ko')}~₩
        {morph.approxPriceMaxKrw.toLocaleString('ko')}
      </p>
    </li>
  )
}

export default Morphs
