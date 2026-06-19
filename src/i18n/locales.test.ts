import { describe, expect, it } from 'vitest'

import en from './locales/en.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'

interface LocaleTree {
  [key: string]: string | LocaleTree
}

function flattenKeys(value: LocaleTree, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (typeof nestedValue === 'string') return [nextKey]
    return flattenKeys(nestedValue, nextKey)
  })
}

describe('i18n locale resources', () => {
  const koKeys = flattenKeys(ko).sort((a, b) => a.localeCompare(b))

  it('keeps Korean and English translation keys in sync', () => {
    expect(flattenKeys(en).sort((a, b) => a.localeCompare(b))).toEqual(koKeys)
  })

  it('keeps Korean and Japanese translation keys in sync', () => {
    expect(flattenKeys(ja).sort((a, b) => a.localeCompare(b))).toEqual(koKeys)
  })
})
