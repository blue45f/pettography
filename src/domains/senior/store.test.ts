import { useOnboardingStore } from '@domains/onboarding'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { makeDefaultProfile, useSeniorStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useSeniorStore.getState().clear()
  useOnboardingStore.getState().reset()
})

afterEach(() => {
  useSeniorStore.getState().clear()
})

describe('makeDefaultProfile', () => {
  it('produces an empty profile bound to the pet', () => {
    const p = makeDefaultProfile('pet-1')
    expect(p.petId).toBe('pet-1')
    expect(p.ageMonths).toBeNull()
    expect(p.acquiredAs).toBe('unknown')
    expect(p.checklist).toEqual({})
    expect(p.notes).toBe('')
  })
})

describe('upsertProfile', () => {
  it('creates a record for an explicit pet', () => {
    const result = useSeniorStore
      .getState()
      .upsertProfile({ petId: 'pet-1', ageMonths: 54, acquiredAs: 'baby', notes: '  hi  ' })
    expect(result).not.toBeNull()
    expect(result?.ageMonths).toBe(54)
    expect(result?.acquiredAs).toBe('baby')
    expect(result?.notes).toBe('hi')
    expect(useSeniorStore.getState().profiles['pet-1'].ageMonths).toBe(54)
  })

  it('rounds and floors age months', () => {
    const r = useSeniorStore
      .getState()
      .upsertProfile({ petId: 'pet-1', ageMonths: -5, acquiredAs: 'adult', notes: '' })
    expect(r?.ageMonths).toBe(0)
  })

  it('preserves the existing checklist when re-saving', () => {
    const store = useSeniorStore.getState()
    store.toggleChecklistItem('weightLog', true, 'pet-1')
    store.upsertProfile({ petId: 'pet-1', ageMonths: 12, acquiredAs: 'juvenile', notes: 'note' })
    expect(useSeniorStore.getState().profiles['pet-1'].checklist).toEqual({ weightLog: true })
  })

  it('clamps notes to 300 chars', () => {
    const long = 'x'.repeat(400)
    const r = useSeniorStore
      .getState()
      .upsertProfile({ petId: 'pet-1', ageMonths: null, acquiredAs: 'unknown', notes: long })
    expect(r?.notes).toHaveLength(300)
  })

  it('falls back to the active pet when petId is omitted', () => {
    const activeId = useOnboardingStore.getState().activePetId
    expect(activeId).not.toBeNull()
    const r = useSeniorStore
      .getState()
      .upsertProfile({ ageMonths: 24, acquiredAs: 'baby', notes: '' })
    expect(r?.petId).toBe(activeId)
  })
})

describe('toggleChecklistItem', () => {
  it('seeds a default profile then toggles an item on and off', () => {
    const store = useSeniorStore.getState()
    store.toggleChecklistItem('vetBaseline', true, 'pet-2')
    expect(useSeniorStore.getState().profiles['pet-2'].checklist.vetBaseline).toBe(true)
    store.toggleChecklistItem('vetBaseline', false, 'pet-2')
    expect(useSeniorStore.getState().profiles['pet-2'].checklist.vetBaseline).toBe(false)
  })

  it('does not disturb an already-saved age/notes', () => {
    const store = useSeniorStore.getState()
    store.upsertProfile({ petId: 'pet-3', ageMonths: 36, acquiredAs: 'adult', notes: 'keep' })
    store.toggleChecklistItem('mobilityCheck', true, 'pet-3')
    const p = useSeniorStore.getState().profiles['pet-3']
    expect(p.ageMonths).toBe(36)
    expect(p.notes).toBe('keep')
    expect(p.checklist.mobilityCheck).toBe(true)
  })
})

describe('removeProfile', () => {
  it('deletes a pet record', () => {
    useSeniorStore
      .getState()
      .upsertProfile({ petId: 'pet-4', ageMonths: 1, acquiredAs: 'baby', notes: '' })
    useSeniorStore.getState().removeProfile('pet-4')
    expect(useSeniorStore.getState().profiles['pet-4']).toBeUndefined()
  })

  it('is a no-op for an unknown pet', () => {
    useSeniorStore
      .getState()
      .upsertProfile({ petId: 'pet-5', ageMonths: 1, acquiredAs: 'baby', notes: '' })
    const before = useSeniorStore.getState().profiles
    useSeniorStore.getState().removeProfile('nope')
    expect(useSeniorStore.getState().profiles).toBe(before)
  })
})
