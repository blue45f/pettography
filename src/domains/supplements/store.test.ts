import { beforeEach, describe, expect, it } from 'vitest'

import { categoryDusts, defaultIntervalDays } from './data'
import { useSupplementsStore } from './store'

function reset() {
  useSupplementsStore.setState({ logs: [], schedule: {} })
}

describe('useSupplementsStore', () => {
  beforeEach(reset)

  it('adds a log with a generated id and respects an explicit petId', () => {
    const log = useSupplementsStore.getState().addLog({
      petId: 'pet-1',
      speciesId: 'sp-leopard-gecko',
      type: 'calcium',
      dustedAt: '2024-01-02',
    })
    expect(log.id).toBeTruthy()
    expect(log.petId).toBe('pet-1')
    expect(log.note).toBe('')
    expect(useSupplementsStore.getState().logs).toHaveLength(1)
  })

  it('falls back to a null petId when none is provided and no pet is active', () => {
    // Passing petId: null explicitly keeps it null (no onboarding lookup).
    const log = useSupplementsStore
      .getState()
      .addLog({ petId: null, speciesId: null, type: 'multivitamin', dustedAt: '2024-01-03' })
    expect(log.petId).toBeNull()
  })

  it('keeps logs sorted by dustedAt descending', () => {
    const add = useSupplementsStore.getState().addLog
    add({ petId: null, speciesId: null, type: 'calcium', dustedAt: '2024-01-01' })
    add({ petId: null, speciesId: null, type: 'calcium', dustedAt: '2024-03-01' })
    add({ petId: null, speciesId: null, type: 'calcium', dustedAt: '2024-02-01' })
    expect(useSupplementsStore.getState().logs.map((l) => l.dustedAt)).toEqual([
      '2024-03-01',
      '2024-02-01',
      '2024-01-01',
    ])
  })

  it('removes a log by id', () => {
    const log = useSupplementsStore
      .getState()
      .addLog({ petId: null, speciesId: null, type: 'calcium', dustedAt: '2024-01-02' })
    useSupplementsStore.getState().removeLog(log.id)
    expect(useSupplementsStore.getState().logs).toHaveLength(0)
  })

  it('sets, floors, and clears a custom interval', () => {
    const setInterval = useSupplementsStore.getState().setInterval
    setInterval('calcium', 3.9)
    expect(useSupplementsStore.getState().schedule.calcium).toBe(3)
    // Non-positive / invalid removes the override.
    setInterval('calcium', 0)
    expect(useSupplementsStore.getState().schedule.calcium).toBeUndefined()
    setInterval('calciumD3', 5)
    setInterval('calciumD3', null)
    expect(useSupplementsStore.getState().schedule.calciumD3).toBeUndefined()
  })

  it('clears all logs and schedule overrides', () => {
    const state = useSupplementsStore.getState()
    state.addLog({ petId: null, speciesId: null, type: 'calcium', dustedAt: '2024-01-02' })
    state.setInterval('calcium', 4)
    useSupplementsStore.getState().clear()
    expect(useSupplementsStore.getState().logs).toHaveLength(0)
    expect(useSupplementsStore.getState().schedule).toEqual({})
  })
})

describe('category cadence helpers', () => {
  it('returns sensible reptile insectivore defaults', () => {
    expect(defaultIntervalDays('reptile', 'calcium')).toBe(2)
    expect(defaultIntervalDays('reptile', 'calciumD3')).toBe(4)
    expect(defaultIntervalDays('reptile', 'multivitamin')).toBe(7)
    expect(categoryDusts('reptile')).toBe(true)
  })

  it('treats arthropods as non-dusting (null intervals)', () => {
    expect(defaultIntervalDays('arthropod', 'calcium')).toBeNull()
    expect(categoryDusts('arthropod')).toBe(false)
  })

  it('returns null / false when no category is selected', () => {
    expect(defaultIntervalDays(null, 'calcium')).toBeNull()
    expect(categoryDusts(undefined)).toBe(false)
  })
})
