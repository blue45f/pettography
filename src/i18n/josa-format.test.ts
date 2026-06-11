import { formatJosa } from '@utils/josa'
import i18next from 'i18next'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * Wiring test for the Korean josa interpolation formatter.
 *
 * Builds a throwaway i18next instance that mirrors `./index.ts` (the josa
 * `FormatterModule` registered against Korean strings) so we verify the
 * `{{name, josa(을/를)}}` syntax resolves end to end — independent of the app's
 * shared singleton and its language-detection side effects.
 */
function makeInstance() {
  const inst = i18next.createInstance()
  inst.use({
    type: 'formatter',
    init() {},
    add() {},
    addCached() {},
    format(value: unknown, format: string | undefined, lng: string | undefined) {
      const raw = value == null ? '' : String(value)
      if (lng === 'ko') {
        const withParticle = formatJosa(value, format)
        if (withParticle !== null) return withParticle
      }
      return raw
    },
  } as never)
  void inst.init({
    lng: 'ko',
    fallbackLng: 'ko',
    resources: {
      ko: {
        translation: {
          add: '{{name, josa(을/를)}} 비교에 추가',
          regulated: '{{name, josa(은/는)}} 규제종입니다.',
        },
      },
      en: { translation: { add: 'Add {{name}} to compare' } },
    },
    interpolation: { escapeValue: false },
  })
  return inst
}

describe('i18n josa formatter wiring', () => {
  const i18n = makeInstance()

  afterEach(async () => {
    await i18n.changeLanguage('ko')
  })

  it('attaches 을/를 by 받침 (no more "게코을(를)")', () => {
    expect(i18n.t('add', { name: '레오파드 게코' })).toBe('레오파드 게코를 비교에 추가')
    expect(i18n.t('add', { name: '볼파이톤' })).toBe('볼파이톤을 비교에 추가')
  })

  it('attaches 은/는 by 받침', () => {
    expect(i18n.t('regulated', { name: '레오파드 게코' })).toBe('레오파드 게코는 규제종입니다.')
    expect(i18n.t('regulated', { name: '볼파이톤' })).toBe('볼파이톤은 규제종입니다.')
  })

  it('leaves non-Korean locales with the raw value', async () => {
    await i18n.changeLanguage('en')
    expect(i18n.t('add', { name: 'Leopard Gecko' })).toBe('Add Leopard Gecko to compare')
  })
})
