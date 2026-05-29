import { useOnboardingStore } from '@features/onboarding'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useTransportStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useTransportStore.getState().clear()
  useOnboardingStore.getState().reset()
})

afterEach(() => {
  useTransportStore.getState().clear()
})

describe('addTrip', () => {
  it('creates a trip with normalized fields', () => {
    const trip = useTransportStore.getState().addTrip({
      petId: 'pet-1',
      speciesId: 'sp-leopard-gecko',
      purpose: 'vet',
      date: '2026-06-10T12:34:56.000Z',
      durationHours: 2,
      notes: '  조심히  ',
    })
    expect(trip.id).toBeTruthy()
    expect(trip.petId).toBe('pet-1')
    expect(trip.date).toBe('2026-06-10')
    expect(trip.durationHours).toBe(2)
    expect(trip.notes).toBe('조심히')
    expect(trip.checklist).toEqual({})
    expect(useTransportStore.getState().trips).toHaveLength(1)
  })

  it('defaults durationHours and notes when omitted', () => {
    const trip = useTransportStore
      .getState()
      .addTrip({ petId: 'pet-1', speciesId: null, purpose: 'move', date: '2026-06-01' })
    expect(trip.durationHours).toBeNull()
    expect(trip.notes).toBe('')
  })

  it('prepends new trips (most recently added first in storage)', () => {
    const store = useTransportStore.getState()
    store.addTrip({ petId: 'pet-1', speciesId: null, purpose: 'vet', date: '2026-06-01' })
    store.addTrip({ petId: 'pet-1', speciesId: null, purpose: 'expo', date: '2026-06-02' })
    const purposes = useTransportStore.getState().trips.map((t) => t.purpose)
    expect(purposes).toEqual(['expo', 'vet'])
  })

  it('falls back to the active pet when petId is omitted', () => {
    const activeId = useOnboardingStore.getState().activePetId
    expect(activeId).not.toBeNull()
    const trip = useTransportStore
      .getState()
      .addTrip({ speciesId: null, purpose: 'other', date: '2026-06-01' })
    expect(trip.petId).toBe(activeId)
  })

  it('keeps a null petId when explicitly passed null', () => {
    const trip = useTransportStore
      .getState()
      .addTrip({ petId: null, speciesId: null, purpose: 'vet', date: '2026-06-01' })
    expect(trip.petId).toBeNull()
  })
})

describe('toggleChecklistItem', () => {
  it('flips a single item on and off for the right trip', () => {
    const store = useTransportStore.getState()
    const trip = store.addTrip({
      petId: 'pet-1',
      speciesId: null,
      purpose: 'vet',
      date: '2026-06-01',
    })
    store.toggleChecklistItem(trip.id, 'secureContainer')
    expect(useTransportStore.getState().trips[0].checklist.secureContainer).toBe(true)
    store.toggleChecklistItem(trip.id, 'secureContainer')
    expect(useTransportStore.getState().trips[0].checklist.secureContainer).toBe(false)
  })

  it('does not touch other trips', () => {
    const store = useTransportStore.getState()
    const a = store.addTrip({ petId: 'pet-1', speciesId: null, purpose: 'vet', date: '2026-06-01' })
    store.addTrip({ petId: 'pet-1', speciesId: null, purpose: 'expo', date: '2026-06-02' })
    store.toggleChecklistItem(a.id, 'water')
    const trips = useTransportStore.getState().trips
    const other = trips.find((t) => t.id !== a.id)
    expect(other?.checklist.water).toBeUndefined()
  })

  it('is a no-op for an unknown trip id', () => {
    const store = useTransportStore.getState()
    store.addTrip({ petId: 'pet-1', speciesId: null, purpose: 'vet', date: '2026-06-01' })
    store.toggleChecklistItem('nope', 'water')
    expect(useTransportStore.getState().trips[0].checklist).toEqual({})
  })
})

describe('removeTrip / clear', () => {
  it('removes a single trip by id', () => {
    const store = useTransportStore.getState()
    const trip = store.addTrip({
      petId: 'pet-1',
      speciesId: null,
      purpose: 'vet',
      date: '2026-06-01',
    })
    store.removeTrip(trip.id)
    expect(useTransportStore.getState().trips).toHaveLength(0)
  })

  it('clears every trip', () => {
    const store = useTransportStore.getState()
    store.addTrip({ petId: 'pet-1', speciesId: null, purpose: 'vet', date: '2026-06-01' })
    store.addTrip({ petId: 'pet-2', speciesId: null, purpose: 'move', date: '2026-06-02' })
    store.clear()
    expect(useTransportStore.getState().trips).toEqual([])
  })
})
