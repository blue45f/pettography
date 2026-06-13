import { beforeEach, describe, expect, it } from 'vitest'

import { defaultSchedule, petKeyOf, useLightingStore } from './store'

/**
 * The store is exercised directly via its `getState()` API (no React render),
 * which is enough to cover the merge / nulling / reset branches. Each test
 * starts from a clean slate.
 */
beforeEach(() => {
  useLightingStore.getState().clear()
})

describe('petKeyOf', () => {
  it('uses the pet id when present, else the default slot', () => {
    expect(petKeyOf('pet-1')).toBe('pet-1')
    expect(petKeyOf(null)).toBe('default')
    expect(petKeyOf(undefined)).toBe('default')
  })
})

describe('defaultSchedule', () => {
  it('is a 12h day with UVB off', () => {
    const d = defaultSchedule('pet-1', 'sp-leopard-gecko')
    expect(d.onHour).toBe(8)
    expect(d.offHour).toBe(20)
    expect(d.hasUvb).toBe(false)
    expect(d.uvbHours).toBeNull()
    expect(d.petId).toBe('pet-1')
    expect(d.speciesId).toBe('sp-leopard-gecko')
  })
})

describe('setSchedule', () => {
  it('creates a schedule for a new pet key and stamps updatedAt', () => {
    const before = Date.now()
    const saved = useLightingStore.getState().setSchedule('pet-1', {
      speciesId: 'sp-bearded-dragon',
      onHour: 7,
      offHour: 19,
      hasUvb: true,
      uvbHours: 10,
      notes: 'T5 tube',
    })
    expect(saved.onHour).toBe(7)
    expect(saved.offHour).toBe(19)
    expect(saved.hasUvb).toBe(true)
    expect(saved.uvbHours).toBe(10)
    expect(Date.parse(saved.updatedAt)).toBeGreaterThanOrEqual(before)
    expect(useLightingStore.getState().schedules['pet-1']).toEqual(saved)
  })

  it('merges a patch into the existing schedule', () => {
    const store = useLightingStore.getState()
    store.setSchedule('pet-1', { speciesId: 'sp-x', onHour: 7, offHour: 19, hasUvb: false })
    store.setSchedule('pet-1', { offHour: 21 })
    const s = useLightingStore.getState().schedules['pet-1']
    expect(s.onHour).toBe(7) // preserved
    expect(s.offHour).toBe(21) // patched
    expect(s.speciesId).toBe('sp-x') // preserved
  })

  it('nulls uvbHours whenever UVB is disabled', () => {
    const store = useLightingStore.getState()
    store.setSchedule('pet-1', { hasUvb: true, uvbHours: 12 })
    expect(useLightingStore.getState().schedules['pet-1'].uvbHours).toBe(12)
    // Turning UVB off clears the on-time even if a value is sent.
    store.setSchedule('pet-1', { hasUvb: false, uvbHours: 8 })
    const s = useLightingStore.getState().schedules['pet-1']
    expect(s.hasUvb).toBe(false)
    expect(s.uvbHours).toBeNull()
  })

  it('keeps the prior uvbHours when toggling without a new value', () => {
    const store = useLightingStore.getState()
    store.setSchedule('pet-1', { hasUvb: true, uvbHours: 11 })
    // Re-save unrelated field; UVB stays on, hours carry over.
    store.setSchedule('pet-1', { notes: 'updated' })
    const s = useLightingStore.getState().schedules['pet-1']
    expect(s.hasUvb).toBe(true)
    expect(s.uvbHours).toBe(11)
  })
})

describe('reset', () => {
  it('drops the saved schedule for a pet', () => {
    const store = useLightingStore.getState()
    store.setSchedule('pet-1', { onHour: 6, offHour: 18 })
    store.reset('pet-1')
    expect(useLightingStore.getState().schedules['pet-1']).toBeUndefined()
  })

  it('is a no-op for an unknown key', () => {
    const store = useLightingStore.getState()
    store.setSchedule('pet-1', { onHour: 6, offHour: 18 })
    store.reset('pet-missing')
    expect(Object.keys(useLightingStore.getState().schedules)).toEqual(['pet-1'])
  })
})

describe('clear', () => {
  it('wipes every saved schedule', () => {
    const store = useLightingStore.getState()
    store.setSchedule('pet-1', { onHour: 6, offHour: 18 })
    store.setSchedule('pet-2', { onHour: 8, offHour: 20 })
    store.clear()
    expect(useLightingStore.getState().schedules).toEqual({})
  })
})
