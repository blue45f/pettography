import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useWishlistStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useWishlistStore.getState().clear()
})

afterEach(() => {
  useWishlistStore.getState().clear()
})

describe('addItem', () => {
  it('creates a wish with an id, empty readiness and a timestamp', () => {
    const item = useWishlistStore
      .getState()
      .addItem({ speciesId: 'sp-ball-python', priority: 'soon' })
    expect(item.id).toBeTruthy()
    expect(item.speciesId).toBe('sp-ball-python')
    expect(item.priority).toBe('soon')
    expect(item.targetDate).toBeNull()
    expect(item.readiness).toEqual({})
    expect(item.createdAt).toBeTruthy()
    expect(useWishlistStore.getState().items).toHaveLength(1)
  })

  it('prepends new items so the newest is first', () => {
    const store = useWishlistStore.getState()
    store.addItem({ speciesId: 'sp-a', priority: 'someday' })
    store.addItem({ speciesId: 'sp-b', priority: 'someday' })
    expect(useWishlistStore.getState().items[0].speciesId).toBe('sp-b')
  })

  it('normalises a target date to a day-date and trims/clamps notes', () => {
    const long = 'x'.repeat(400)
    const item = useWishlistStore.getState().addItem({
      speciesId: 'sp-a',
      priority: 'next',
      targetDate: '2026-09-01T12:34:56.000Z',
      notes: `  ${long}  `,
    })
    expect(item.targetDate).toBe('2026-09-01')
    expect(item.notes).toHaveLength(300)
  })
})

describe('toggleReadiness', () => {
  it('turns a key on then off, leaving others untouched', () => {
    const item = useWishlistStore.getState().addItem({ speciesId: 'sp-a', priority: 'soon' })
    useWishlistStore.getState().toggleReadiness(item.id, 'space')
    expect(useWishlistStore.getState().items[0].readiness.space).toBe(true)
    useWishlistStore.getState().toggleReadiness(item.id, 'budget')
    useWishlistStore.getState().toggleReadiness(item.id, 'space')
    const after = useWishlistStore.getState().items[0]
    expect(after.readiness.space).toBe(false)
    expect(after.readiness.budget).toBe(true)
  })

  it('is a no-op for an unknown wish id', () => {
    useWishlistStore.getState().addItem({ speciesId: 'sp-a', priority: 'soon' })
    const before = useWishlistStore.getState().items
    useWishlistStore.getState().toggleReadiness('nope', 'space')
    expect(useWishlistStore.getState().items).toEqual(before)
  })
})

describe('updateItem', () => {
  it('patches priority, target date and notes', () => {
    const item = useWishlistStore.getState().addItem({ speciesId: 'sp-a', priority: 'someday' })
    useWishlistStore.getState().updateItem(item.id, {
      priority: 'next',
      targetDate: '2026-12-25T00:00:00.000Z',
      notes: '  hello  ',
    })
    const after = useWishlistStore.getState().items[0]
    expect(after.priority).toBe('next')
    expect(after.targetDate).toBe('2026-12-25')
    expect(after.notes).toBe('hello')
  })

  it('clears the target date when patched with null', () => {
    const item = useWishlistStore
      .getState()
      .addItem({ speciesId: 'sp-a', priority: 'soon', targetDate: '2026-01-01' })
    useWishlistStore.getState().updateItem(item.id, { targetDate: null })
    expect(useWishlistStore.getState().items[0].targetDate).toBeNull()
  })

  it('preserves readiness across an update', () => {
    const item = useWishlistStore.getState().addItem({ speciesId: 'sp-a', priority: 'soon' })
    useWishlistStore.getState().toggleReadiness(item.id, 'vet')
    useWishlistStore.getState().updateItem(item.id, { priority: 'next' })
    expect(useWishlistStore.getState().items[0].readiness.vet).toBe(true)
  })
})

describe('removeItem / clear', () => {
  it('removes a single wish by id', () => {
    const a = useWishlistStore.getState().addItem({ speciesId: 'sp-a', priority: 'soon' })
    useWishlistStore.getState().addItem({ speciesId: 'sp-b', priority: 'soon' })
    useWishlistStore.getState().removeItem(a.id)
    const items = useWishlistStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].speciesId).toBe('sp-b')
  })

  it('clear empties the list', () => {
    useWishlistStore.getState().addItem({ speciesId: 'sp-a', priority: 'soon' })
    useWishlistStore.getState().clear()
    expect(useWishlistStore.getState().items).toEqual([])
  })
})
