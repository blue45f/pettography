import Alert from '@components/common/Alert'
import EmptyState from '@components/common/EmptyState'
import { MORPHS } from '@domains/morphs'
import { useSpeciesList } from '@domains/species'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Morphs.module.css'

const SPIDER_WELFARE_STUDY_URL = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9377635/'

function Morphs() {
  const { t } = useTranslation()
  useDocumentTitle(t('morphs.title'))

  const { data: allSpecies = [] } = useSpeciesList({})
  const availableSpecies = useMemo(() => {
    const slugs = new Set(MORPHS.map((morph) => morph.speciesSlug))
    return allSpecies.filter((species) => slugs.has(species.slug))
  }, [allSpecies])
  const [chosenSlug, setChosenSlug] = useState<string | null>(null)
  const selectedSlug = chosenSlug ?? availableSpecies[0]?.slug ?? null
  const morphs = useMemo(
    () => MORPHS.filter((morph) => morph.speciesSlug === selectedSlug),
    [selectedSlug]
  )
  const selectedSpecies = availableSpecies.find((species) => species.slug === selectedSlug)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('morphs.eyebrow')}</p>
        <h1>{t('morphs.title')}</h1>
        <p className={styles.subtitle}>{t('morphs.subtitle')}</p>
      </header>

      <Alert variant="warning" title={t('morphs.welfareTitle')}>
        <p>{t('morphs.welfareBody')}</p>
        <a
          className={styles.sourceLink}
          href={SPIDER_WELFARE_STUDY_URL}
          target="_blank"
          rel="noreferrer"
        >
          {t('morphs.sourceLink')}
        </a>
      </Alert>

      <div className={styles.speciesNav} role="radiogroup" aria-label={t('morphs.pickSpecies')}>
        {availableSpecies.map((species) => (
          <button
            key={species.id}
            type="button"
            role="radio"
            aria-checked={selectedSlug === species.slug}
            onClick={() => setChosenSlug(species.slug)}
            className={`${styles.speciesChip} ${selectedSlug === species.slug ? styles.speciesActive : ''}`}
          >
            <span aria-hidden="true">{species.heroEmoji}</span>
            <span>{species.koreanName}</span>
          </button>
        ))}
      </div>

      {!selectedSpecies ? (
        <EmptyState icon="🎨" title={t('morphs.empty')} />
      ) : (
        <>
          <div className={styles.contextHead}>
            <div>
              <p className={styles.contextKicker}>{t('morphs.contextKicker')}</p>
              <h2>{selectedSpecies.koreanName}</h2>
            </div>
            <Link to={`/species/${selectedSpecies.slug}`} className={styles.contextLink}>
              {t('morphs.openDetail')}
            </Link>
          </div>
          <ul className={styles.morphGrid}>
            {morphs.map((morph) => (
              <li key={morph.id} className={styles.morphCard}>
                <h3 className={styles.morphName}>{morph.name}</h3>
                <p className={styles.morphDesc}>{morph.description}</p>
                <p className={styles.cardNote}>{t('morphs.cardNote')}</p>
              </li>
            ))}
          </ul>
          <div className={styles.learningLinkWrap}>
            <Link to="/genetics" className={styles.learningLink}>
              {t('morphs.openGenetics')}
            </Link>
          </div>
        </>
      )}

      <p className={styles.disclaimer}>{t('morphs.disclaimer')}</p>
    </section>
  )
}

export default Morphs
