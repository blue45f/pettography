import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useFeedersStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useFeedersStore.getState().clear()
})

afterEach(() => {
  useFeedersStore.getState().clear()
})

describe('feeders store', () => {
  it('starts empty', () => {
    expect(useFeedersStore.getState().colonies).toEqual([])
  })

  it('adds a colony with a null last-fed date and a generated id', () => {
    const colony = useFeedersStore.getState().addColony({
      type: 'dubia',
      name: '두비아 메인',
      startedAt: '2024-03-01',
      estimateCount: 200,
    })
    const { colonies } = useFeedersStore.getState()
    expect(colonies).toHaveLength(1)
    expect(colony.id).toBeTruthy()
    expect(colony.lastFedAt).toBeNull()
    expect(colony.estimateCount).toBe(200)
    expect(colony.notes).toBe('')
  })

  it('defaults estimateCount to null when omitted', () => {
    const colony = useFeedersStore.getState().addColony({
      type: 'springtail',
      name: '톡토기',
      startedAt: '2024-03-01',
    })
    expect(colony.estimateCount).toBeNull()
  })

  it('keeps colonies sorted by start date, newest first', () => {
    const store = useFeedersStore.getState()
    store.addColony({ type: 'cricket', name: 'older', startedAt: '2024-01-01' })
    store.addColony({ type: 'mealworm', name: 'newer', startedAt: '2024-06-01' })
    expect(useFeedersStore.getState().colonies.map((c) => c.name)).toEqual(['newer', 'older'])
  })

  it('markFed sets lastFedAt to the day part of the given date', () => {
    const colony = useFeedersStore
      .getState()
      .addColony({ type: 'dubia', name: 'c', startedAt: '2024-03-01' })
    useFeedersStore.getState().markFed(colony.id, '2024-05-29T09:15:00.000Z')
    const updated = useFeedersStore.getState().colonies.find((c) => c.id === colony.id)
    expect(updated?.lastFedAt).toBe('2024-05-29')
  })

  it('markFed ignores unknown ids', () => {
    const colony = useFeedersStore
      .getState()
      .addColony({ type: 'dubia', name: 'c', startedAt: '2024-03-01' })
    useFeedersStore.getState().markFed('does-not-exist', '2024-05-29')
    const updated = useFeedersStore.getState().colonies.find((c) => c.id === colony.id)
    expect(updated?.lastFedAt).toBeNull()
  })

  it('updateColony patches the matching colony only', () => {
    const a = useFeedersStore
      .getState()
      .addColony({ type: 'dubia', name: 'A', startedAt: '2024-03-01' })
    const b = useFeedersStore
      .getState()
      .addColony({ type: 'cricket', name: 'B', startedAt: '2024-02-01' })
    useFeedersStore.getState().updateColony(a.id, { name: 'A2', estimateCount: 50 })
    const colonies = useFeedersStore.getState().colonies
    expect(colonies.find((c) => c.id === a.id)?.name).toBe('A2')
    expect(colonies.find((c) => c.id === a.id)?.estimateCount).toBe(50)
    expect(colonies.find((c) => c.id === b.id)?.name).toBe('B')
  })

  it('removeColony drops the matching colony', () => {
    const a = useFeedersStore
      .getState()
      .addColony({ type: 'dubia', name: 'A', startedAt: '2024-03-01' })
    const b = useFeedersStore
      .getState()
      .addColony({ type: 'cricket', name: 'B', startedAt: '2024-02-01' })
    useFeedersStore.getState().removeColony(a.id)
    const colonies = useFeedersStore.getState().colonies
    expect(colonies).toHaveLength(1)
    expect(colonies[0].id).toBe(b.id)
  })

  it('clear removes every colony', () => {
    const store = useFeedersStore.getState()
    store.addColony({ type: 'dubia', name: 'A', startedAt: '2024-03-01' })
    store.addColony({ type: 'cricket', name: 'B', startedAt: '2024-02-01' })
    useFeedersStore.getState().clear()
    expect(useFeedersStore.getState().colonies).toEqual([])
  })
})
