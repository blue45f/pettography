import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import useLocalStorage from './useLocalStorage'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useLocalStorage', () => {
  it('returns initial value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('k', 'init'))
    expect(result.current[0]).toBe('init')
  })

  it('reads existing value from localStorage', () => {
    localStorage.setItem('k', JSON.stringify('saved'))
    const { result } = renderHook(() => useLocalStorage('k', 'init'))
    expect(result.current[0]).toBe('saved')
  })

  it('persists a new value', () => {
    const { result } = renderHook(() => useLocalStorage<string>('k', 'init'))
    act(() => result.current[1]('updated'))
    expect(result.current[0]).toBe('updated')
    expect(localStorage.getItem('k')).toBe(JSON.stringify('updated'))
  })

  it('supports functional updater', () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0))
    act(() => result.current[1]((prev) => prev + 1))
    act(() => result.current[1]((prev) => prev + 1))
    expect(result.current[0]).toBe(2)
  })

  it('removeValue resets to initial value', () => {
    const { result } = renderHook(() => useLocalStorage<string>('k', 'init'))
    act(() => result.current[1]('updated'))
    expect(result.current[0]).toBe('updated')
    act(() => result.current[2]())
    expect(result.current[0]).toBe('init')
    expect(localStorage.getItem('k')).toBeNull()
  })

  it('warns and falls back when JSON parse fails', () => {
    localStorage.setItem('k', '{not-json')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useLocalStorage('k', 'fallback'))
    expect(result.current[0]).toBe('fallback')
    expect(warnSpy).toHaveBeenCalled()
  })

  it('warns when setItem throws', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const { result } = renderHook(() => useLocalStorage('k', 'init'))
    act(() => result.current[1]('x'))
    expect(warnSpy).toHaveBeenCalled()
    setItemSpy.mockRestore()
  })

  it('syncs state across instances via local-storage event', () => {
    const { result: a } = renderHook(() => useLocalStorage('shared', 0))
    const { result: b } = renderHook(() => useLocalStorage('shared', 0))
    act(() => a.current[1](7))
    expect(b.current[0]).toBe(7)
  })
})
