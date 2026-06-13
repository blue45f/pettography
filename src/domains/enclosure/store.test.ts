import { useOnboardingStore } from '@domains/onboarding'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { NO_PET_KEY, resolvePetKey, useEnclosureStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useEnclosureStore.getState().clear()
  useOnboardingStore.getState().reset()
})

afterEach(() => {
  useEnclosureStore.getState().clear()
})

describe('enclosure store', () => {
  it('starts with no checks', () => {
    expect(useEnclosureStore.getState().checks).toEqual({})
  })

  it('creates a check with nulls for omitted dimensions', () => {
    const check = useEnclosureStore.getState().setCheck('pet-1', { speciesId: 'sp-ball-python' })
    expect(check.petId).toBe('pet-1')
    expect(check.speciesId).toBe('sp-ball-python')
    expect(check.lengthCm).toBeNull()
    expect(check.widthCm).toBeNull()
    expect(check.heightCm).toBeNull()
    expect(check.updatedAt).toBeTruthy()
  })

  it('merges a dimension patch into the existing check', () => {
    const store = useEnclosureStore.getState()
    store.setCheck('pet-1', { speciesId: 'sp-corn-snake', lengthCm: 120 })
    store.setCheck('pet-1', { widthCm: 45, heightCm: 45 })
    const check = useEnclosureStore.getState().checks['pet-1']
    expect(check.speciesId).toBe('sp-corn-snake')
    expect(check.lengthCm).toBe(120)
    expect(check.widthCm).toBe(45)
    expect(check.heightCm).toBe(45)
  })

  it('stores a null petId for the no-pet sentinel key', () => {
    const check = useEnclosureStore.getState().setCheck(NO_PET_KEY, { lengthCm: 60 })
    expect(check.petId).toBeNull()
    expect(check.lengthCm).toBe(60)
  })

  it('keeps checks isolated per pet key', () => {
    const store = useEnclosureStore.getState()
    store.setCheck('pet-1', { lengthCm: 60 })
    store.setCheck('pet-2', { lengthCm: 120 })
    const { checks } = useEnclosureStore.getState()
    expect(checks['pet-1'].lengthCm).toBe(60)
    expect(checks['pet-2'].lengthCm).toBe(120)
  })

  it('reset removes only the targeted pet key', () => {
    const store = useEnclosureStore.getState()
    store.setCheck('pet-1', { lengthCm: 60 })
    store.setCheck('pet-2', { lengthCm: 120 })
    store.reset('pet-1')
    const { checks } = useEnclosureStore.getState()
    expect(checks['pet-1']).toBeUndefined()
    expect(checks['pet-2']).toBeDefined()
  })

  it('reset is a no-op for an unknown pet key', () => {
    const store = useEnclosureStore.getState()
    store.setCheck('pet-1', { lengthCm: 60 })
    store.reset('pet-unknown')
    expect(useEnclosureStore.getState().checks['pet-1']).toBeDefined()
  })

  it('clear removes every check', () => {
    const store = useEnclosureStore.getState()
    store.setCheck('pet-1', { lengthCm: 60 })
    store.setCheck('pet-2', { lengthCm: 120 })
    store.clear()
    expect(useEnclosureStore.getState().checks).toEqual({})
  })
})

describe('resolvePetKey', () => {
  it('returns the explicit key when provided', () => {
    expect(resolvePetKey('pet-7')).toBe('pet-7')
  })

  it('falls back to the active pet id when no key is given', () => {
    const activeId = useOnboardingStore.getState().activePetId
    expect(resolvePetKey()).toBe(activeId)
  })
})
