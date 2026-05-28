import useDocumentTitle from '@hooks/useDocumentTitle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Faq.module.css'

const QUESTION_KEYS = [
  'firstPet',
  'wildlifeLaw',
  'insurance',
  'morphCost',
  'enclosureSetup',
  'feeding',
  'emergency',
  'multiPet',
  'dataLoss',
  'mapKey',
] as const

type QuestionKey = (typeof QUESTION_KEYS)[number]

const QUESTION_LINKS: Partial<Record<QuestionKey, { to: string; labelKey: string }>> = {
  firstPet: { to: '/match', labelKey: 'faq.linkMatch' },
  wildlifeLaw: { to: '/registry', labelKey: 'faq.linkRegistry' },
  insurance: { to: '/insurance', labelKey: 'faq.linkInsurance' },
  morphCost: { to: '/morphs', labelKey: 'faq.linkMorphs' },
  enclosureSetup: { to: '/setup', labelKey: 'faq.linkSetup' },
  feeding: { to: '/food', labelKey: 'faq.linkFood' },
  emergency: { to: '/sos', labelKey: 'faq.linkSos' },
  multiPet: { to: '/about', labelKey: 'faq.linkAbout' },
  dataLoss: { to: '/backup', labelKey: 'faq.linkBackup' },
  mapKey: { to: '/about', labelKey: 'faq.linkAbout' },
}

function Faq() {
  const { t } = useTranslation()
  useDocumentTitle(t('faq.title'))

  const [openId, setOpenId] = useState<QuestionKey | null>(QUESTION_KEYS[0])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('faq.title')}</h1>
        <p className={styles.subtitle}>{t('faq.subtitle')}</p>
      </header>

      <ol className={styles.list}>
        {QUESTION_KEYS.map((key, idx) => {
          const open = openId === key
          const link = QUESTION_LINKS[key]
          return (
            <li key={key} className={styles.item}>
              <button
                type="button"
                className={[styles.q, open ? styles.qOpen : ''].join(' ')}
                aria-expanded={open}
                aria-controls={`faq-a-${key}`}
                onClick={() => setOpenId(open ? null : key)}
              >
                <span className={styles.qNo}>{String(idx + 1).padStart(2, '0')}</span>
                <span className={styles.qText}>{t(`faq.questions.${key}.q`)}</span>
                <span aria-hidden="true" className={styles.qIcon}>
                  {open ? '−' : '+'}
                </span>
              </button>
              {open && (
                <div id={`faq-a-${key}`} className={styles.a}>
                  <p>{t(`faq.questions.${key}.a`)}</p>
                  {link && (
                    <Link to={link.to} className={styles.aLink}>
                      {t(link.labelKey)} →
                    </Link>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default Faq
