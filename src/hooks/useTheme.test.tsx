import { useAppStore } from '@store/index'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import useTheme from './useTheme'

const initialSnapshot = useAppStore.getState()

function setMatches(matches: boolean) {
  globalThis.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

beforeEach(() => {
  useAppStore.setState(initialSnapshot, true)
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  setMatches(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useTheme', () => {
  it('defaults to light when no stored / system preference', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(result.current.isDark).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('uses stored theme from app-store on mount when present', () => {
    localStorage.setItem('app-store', JSON.stringify({ state: { theme: 'dark' }, version: 0 }))
    useAppStore.setState({ theme: 'dark' })

    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('uses system preference when no stored theme', async () => {
    setMatches(true)
    const { result } = renderHook(() => useTheme())
    await vi.waitFor(() => expect(result.current.theme).toBe('dark'))
  })

  it('toggleTheme switches between light and dark', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('setTheme explicitly sets the theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('dark'))
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('falls back to light when stored value is invalid', () => {
    localStorage.setItem('app-store', JSON.stringify({ state: { theme: 'bogus' }, version: 0 }))
    const { result } = renderHook(() => useTheme())
    expect(['light', 'dark']).toContain(result.current.theme)
  })

  it('subscribes to system color-scheme changes and updates when no theme is stored', () => {
    const addEventListener = vi.fn()
    const removeEventListener = vi.fn()
    const mql = {
      matches: false,
      media: '',
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    globalThis.matchMedia = vi.fn().mockReturnValue(mql)

    const { result, unmount } = renderHook(() => useTheme())

    const changeCall = addEventListener.mock.calls.find((c) => c[0] === 'change')
    expect(changeCall).toBeDefined()
    const handler = changeCall![1] as (e: MediaQueryListEvent) => void

    localStorage.clear()
    act(() => {
      handler({ matches: true } as MediaQueryListEvent)
    })
    expect(result.current.theme).toBe('dark')

    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', handler)
  })
})
