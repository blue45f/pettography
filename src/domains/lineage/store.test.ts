import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useLineageStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useLineageStore.getState().clear()
})

afterEach(() => {
  useLineageStore.getState().clear()
})

describe('lineage store', () => {
  it('starts empty', () => {
    expect(useLineageStore.getState().animals).toEqual([])
  })

  it('adds an animal with defaults and a generated id', () => {
    const created = useLineageStore.getState().addAnimal({ name: 'Apollo', sex: 'male' })
    expect(created.id).toBeTruthy()
    expect(created.createdAt).toBeTruthy()
    expect(created.speciesId).toBeNull()
    expect(created.morph).toBe('')
    expect(created.sireId).toBeNull()
    expect(created.damId).toBeNull()
    expect(useLineageStore.getState().animals).toHaveLength(1)
  })

  it('persists explicit parentage and species', () => {
    const sire = useLineageStore.getState().addAnimal({ name: 'Sire', sex: 'male' })
    const dam = useLineageStore.getState().addAnimal({ name: 'Dam', sex: 'female' })
    const child = useLineageStore.getState().addAnimal({
      name: 'Child',
      sex: 'unknown',
      speciesId: 'sp-ball-python',
      morph: 'Pastel',
      sireId: sire.id,
      damId: dam.id,
    })
    expect(child.sireId).toBe(sire.id)
    expect(child.damId).toBe(dam.id)
    expect(child.speciesId).toBe('sp-ball-python')
    expect(child.morph).toBe('Pastel')
  })

  it('updates a subset of fields, leaving the id and createdAt intact', () => {
    const a = useLineageStore.getState().addAnimal({ name: 'Old', sex: 'unknown' })
    useLineageStore.getState().updateAnimal(a.id, { name: 'New', sex: 'female', morph: 'Albino' })
    const updated = useLineageStore.getState().animals.find((x) => x.id === a.id)
    expect(updated?.name).toBe('New')
    expect(updated?.sex).toBe('female')
    expect(updated?.morph).toBe('Albino')
    expect(updated?.id).toBe(a.id)
    expect(updated?.createdAt).toBe(a.createdAt)
  })

  it('updateAnimal is a no-op for an unknown id', () => {
    const a = useLineageStore.getState().addAnimal({ name: 'Keep', sex: 'male' })
    useLineageStore.getState().updateAnimal('ghost', { name: 'Nope' })
    expect(useLineageStore.getState().animals.find((x) => x.id === a.id)?.name).toBe('Keep')
  })

  it('removes an animal and detaches it from any child that referenced it', () => {
    const sire = useLineageStore.getState().addAnimal({ name: 'Sire', sex: 'male' })
    const dam = useLineageStore.getState().addAnimal({ name: 'Dam', sex: 'female' })
    const child = useLineageStore.getState().addAnimal({
      name: 'Child',
      sex: 'unknown',
      sireId: sire.id,
      damId: dam.id,
    })

    useLineageStore.getState().removeAnimal(sire.id)
    const animals = useLineageStore.getState().animals
    expect(animals.find((a) => a.id === sire.id)).toBeUndefined()
    const updatedChild = animals.find((a) => a.id === child.id)
    expect(updatedChild?.sireId).toBeNull() // detached
    expect(updatedChild?.damId).toBe(dam.id) // untouched
  })

  it('detaches the same animal used as both sire and dam', () => {
    const parent = useLineageStore.getState().addAnimal({ name: 'Parent', sex: 'unknown' })
    const kid = useLineageStore
      .getState()
      .addAnimal({ name: 'Kid', sex: 'unknown', sireId: parent.id, damId: parent.id })
    useLineageStore.getState().removeAnimal(parent.id)
    const updated = useLineageStore.getState().animals.find((a) => a.id === kid.id)
    expect(updated?.sireId).toBeNull()
    expect(updated?.damId).toBeNull()
  })

  it('clear empties the registry', () => {
    useLineageStore.getState().addAnimal({ name: 'A', sex: 'male' })
    useLineageStore.getState().addAnimal({ name: 'B', sex: 'female' })
    useLineageStore.getState().clear()
    expect(useLineageStore.getState().animals).toEqual([])
  })
})
