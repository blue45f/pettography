import { useTranslation } from 'react-i18next'

import styles from './LanguageToggle.module.css'

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

const LABELS: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
}

function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as SupportedLanguage)
    ? (i18n.resolvedLanguage as SupportedLanguage)
    : 'ko'

  return (
    <label className={styles.wrapper}>
      <span className={styles.label}>{t('common.language')}</span>
      <select
        className={styles.select}
        value={current}
        onChange={(e) => {
          void i18n.changeLanguage(e.target.value)
        }}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng}>
            {LABELS[lng] ?? lng}
          </option>
        ))}
      </select>
    </label>
  )
}

export default LanguageToggle
