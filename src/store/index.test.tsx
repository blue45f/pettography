import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useAppStore } from './index'

const initialSnapshot = useAppStore.getState()

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState(initialSnapshot, true)
})

afterEach(() => {
  localStorage.clear()
})

describe('useAppStore', () => {
  it('provides default values', () => {
    const { result } = renderHook(() => useAppStore())
    expect(result.current.theme).toBe('light')
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('setTheme updates theme', () => {
    const { result } = renderHook(() => useAppStore())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(useAppStore.getState().theme).toBe('dark')
  })

  it('setUser sets user and isAuthenticated true', () => {
    const user = { id: '1', name: '홍길동', email: 'hong@example.com' }
    act(() => {
      useAppStore.getState().setUser(user)
    })
    expect(useAppStore.getState().user).toEqual(user)
    expect(useAppStore.getState().isAuthenticated).toBe(true)
  })

  it('setUser(null) clears user', () => {
    act(() => {
      useAppStore.getState().setUser({ id: '1', name: 'a', email: 'a@a.com' })
    })
    expect(useAppStore.getState().isAuthenticated).toBe(true)

    act(() => {
      useAppStore.getState().setUser(null)
    })
    expect(useAppStore.getState().user).toBeNull()
    expect(useAppStore.getState().isAuthenticated).toBe(false)
  })

  it('logout clears user and authentication', () => {
    act(() => {
      useAppStore.getState().setUser({ id: '2', name: 'b', email: 'b@b.com' })
    })
    expect(useAppStore.getState().isAuthenticated).toBe(true)

    act(() => {
      useAppStore.getState().logout()
    })
    expect(useAppStore.getState().user).toBeNull()
    expect(useAppStore.getState().isAuthenticated).toBe(false)
  })

  it('persists theme and user to localStorage with the app-store key', () => {
    act(() => {
      useAppStore.getState().setTheme('dark')
      useAppStore.getState().setUser({ id: '3', name: 'c', email: 'c@c.com' })
    })
    const raw = localStorage.getItem('app-store')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.theme).toBe('dark')
    expect(parsed.state.user).toEqual({ id: '3', name: 'c', email: 'c@c.com' })
  })
})
