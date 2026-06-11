import { formatJosa } from '@utils/josa'
import i18n, { type FormatterModule } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Custom interpolation formatter module.
 *
 * Adds a `josa(<particle>)` format so Korean strings can attach the correct
 * postposition to an interpolated noun, e.g. `"{{name, josa(을/를)}} 추가"`
 * resolves to "레오파드 게코를 추가" / "볼파이톤을 추가" instead of the awkward
 * "…을(를)" fallback. The particle is only applied for Korean; other locales
 * receive the raw value (their grammar needs no 받침-based selection).
 *
 * i18next v26 resolves interpolation formats through a `FormatterModule`, so the
 * formatter is registered as a plugin rather than via the removed
 * `interpolation.format` option.
 */
const josaFormatter: FormatterModule = {
  type: 'formatter',
  init() {},
  add() {},
  addCached() {},
  format(value, format, lng) {
    const raw = value == null ? '' : String(value)
    if (lng === 'ko') {
      const withParticle = formatJosa(value, format)
      if (withParticle !== null) return withParticle
    }
    return raw
  },
}

void i18n
  .use(josaFormatter)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
    },
    fallbackLng: 'ko',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    returnNull: false,
  })

export default i18n
