import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { isOnboardingComplete, useOnboardingStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useOnboardingStore.getState().reset()
})

afterEach(() => {
  useOnboardingStore.getState().reset()
})

describe('onboarding store', () => {
  it('starts with an empty profile', () => {
    const { profile } = useOnboardingStore.getState()
    expect(profile.category).toBeNull()
    expect(profile.speciesId).toBeNull()
    expect(profile.location).toBeNull()
    expect(profile.completedAt).toBeNull()
    expect(isOnboardingComplete(profile)).toBe(false)
  })

  it('marks the profile complete only after every step is filled', () => {
    const store = useOnboardingStore.getState()
    store.setCategory('reptile')
    expect(isOnboardingComplete(useOnboardingStore.getState().profile)).toBe(false)
    store.setSpecies('sp-leopard-gecko')
    store.setLocation({
      label: '서울 송파구',
      presetId: 'songpa',
      lat: 37.5145,
      lng: 127.1058,
    })
    store.complete()
    const completed = useOnboardingStore.getState().profile
    expect(completed.category).toBe('reptile')
    expect(completed.speciesId).toBe('sp-leopard-gecko')
    expect(completed.location?.presetId).toBe('songpa')
    expect(completed.completedAt).not.toBeNull()
    expect(isOnboardingComplete(completed)).toBe(true)
  })

  it('clears the species selection when the category changes', () => {
    const store = useOnboardingStore.getState()
    store.setCategory('reptile')
    store.setSpecies('sp-leopard-gecko')
    store.setCategory('bird')
    expect(useOnboardingStore.getState().profile.speciesId).toBeNull()
  })
})
