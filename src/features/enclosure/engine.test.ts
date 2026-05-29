import { describe, it, expect } from 'vitest'

import { enclosureVolumeLiters, meetsMinimum, verdict } from './engine'

describe('enclosureVolumeLiters', () => {
  it('converts cm³ to litres (1000 cm³ = 1 L)', () => {
    expect(enclosureVolumeLiters(10, 10, 10)).toBe(1)
  })

  it('computes a leopard gecko 60×40×30 footprint as 72 L', () => {
    expect(enclosureVolumeLiters(60, 40, 30)).toBe(72)
  })

  it('rounds to one decimal place', () => {
    // 33 * 33 * 33 = 35937 cm³ => 35.937 L => 35.9
    expect(enclosureVolumeLiters(33, 33, 33)).toBe(35.9)
  })

  it('returns 0 when any dimension is 0', () => {
    expect(enclosureVolumeLiters(0, 40, 30)).toBe(0)
  })
})

describe('meetsMinimum', () => {
  const min = { l: 60, w: 40, h: 30 }

  it('passes when all dimensions exceed the minimum', () => {
    const r = meetsMinimum({ l: 90, w: 45, h: 45 }, min)
    expect(r.ok).toBe(true)
    expect(r.shortfall).toEqual({ l: false, w: false, h: false })
  })

  it('passes when dimensions are exactly at the floor (strict allows equal)', () => {
    const r = meetsMinimum({ l: 60, w: 40, h: 30 }, min)
    expect(r.ok).toBe(true)
    expect(r.shortfall).toEqual({ l: false, w: false, h: false })
  })

  it('flags only the dimensions that fall short', () => {
    const r = meetsMinimum({ l: 50, w: 40, h: 20 }, min)
    expect(r.ok).toBe(false)
    expect(r.shortfall).toEqual({ l: true, w: false, h: true })
  })

  it('flags every dimension when all are below', () => {
    const r = meetsMinimum({ l: 10, w: 10, h: 10 }, min)
    expect(r.ok).toBe(false)
    expect(r.shortfall).toEqual({ l: true, w: true, h: true })
  })

  it('does not flag a missing (null) dimension as a shortfall', () => {
    const r = meetsMinimum({ l: null, w: 30, h: 30 }, min)
    expect(r.shortfall.l).toBe(false)
    expect(r.shortfall.w).toBe(true)
    // ok still reflects only the flags it could compute
    expect(r.ok).toBe(false)
  })
})

describe('verdict', () => {
  const min = { l: 60, w: 40, h: 30 }

  it('is adequate when all current dimensions meet the floor', () => {
    expect(verdict({ l: 90, w: 45, h: 45 }, min)).toBe('adequate')
  })

  it('is adequate at exactly the floor', () => {
    expect(verdict({ l: 60, w: 40, h: 30 }, min)).toBe('adequate')
  })

  it('is upgrade when any dimension falls short', () => {
    expect(verdict({ l: 50, w: 40, h: 30 }, min)).toBe('upgrade')
  })

  it('is unknown when the length is missing', () => {
    expect(verdict({ l: null, w: 40, h: 30 }, min)).toBe('unknown')
  })

  it('is unknown when the width is missing', () => {
    expect(verdict({ l: 60, w: null, h: 30 }, min)).toBe('unknown')
  })

  it('is unknown when the height is missing', () => {
    expect(verdict({ l: 60, w: 40, h: null }, min)).toBe('unknown')
  })

  it('is unknown when all dimensions are missing', () => {
    expect(verdict({ l: null, w: null, h: null }, min)).toBe('unknown')
  })
})
