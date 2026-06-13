import { beforeEach, describe, expect, it } from 'vitest'

import { useBcsStore } from './store'

function reset() {
  useBcsStore.setState({ entries: [] })
}

describe('useBcsStore', () => {
  beforeEach(reset)

  it('adds an entry with a generated id and respects an explicit petId', () => {
    const entry = useBcsStore.getState().addEntry({
      petId: 'pet-1',
      speciesId: 'sp-leopard-gecko',
      assessedAt: '2026-01-02',
      score: 3,
    })
    expect(entry.id).toBeTruthy()
    expect(entry.petId).toBe('pet-1')
    expect(entry.score).toBe(3)
    expect(entry.note).toBe('')
    expect(entry.createdAt).toBeTruthy()
    expect(useBcsStore.getState().entries).toHaveLength(1)
  })

  it('keeps an explicit null petId without an onboarding lookup', () => {
    const entry = useBcsStore
      .getState()
      .addEntry({ petId: null, speciesId: null, assessedAt: '2026-01-03', score: 5 })
    expect(entry.petId).toBeNull()
  })

  it('trims and caps the note at 200 characters', () => {
    const long = 'x'.repeat(250)
    const entry = useBcsStore.getState().addEntry({
      petId: null,
      speciesId: null,
      assessedAt: '2026-01-04',
      score: 2,
      note: `  ${long}  `,
    })
    expect(entry.note).toHaveLength(200)
  })

  it('keeps entries sorted by assessedAt descending', () => {
    const add = useBcsStore.getState().addEntry
    add({ petId: null, speciesId: null, assessedAt: '2026-01-01', score: 1 })
    add({ petId: null, speciesId: null, assessedAt: '2026-03-01', score: 3 })
    add({ petId: null, speciesId: null, assessedAt: '2026-02-01', score: 2 })
    expect(useBcsStore.getState().entries.map((e) => e.assessedAt)).toEqual([
      '2026-03-01',
      '2026-02-01',
      '2026-01-01',
    ])
  })

  it('removes an entry by id', () => {
    const entry = useBcsStore
      .getState()
      .addEntry({ petId: null, speciesId: null, assessedAt: '2026-01-02', score: 3 })
    useBcsStore.getState().removeEntry(entry.id)
    expect(useBcsStore.getState().entries).toHaveLength(0)
  })

  it('clears all entries', () => {
    const add = useBcsStore.getState().addEntry
    add({ petId: null, speciesId: null, assessedAt: '2026-01-02', score: 3 })
    add({ petId: null, speciesId: null, assessedAt: '2026-01-03', score: 4 })
    useBcsStore.getState().clear()
    expect(useBcsStore.getState().entries).toHaveLength(0)
  })
})
