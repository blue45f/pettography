import { useAppStore } from '@store/index'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import ProtectedRoute from './ProtectedRoute'

beforeEach(() => {
  localStorage.clear()
  useAppStore.setState(useAppStore.getInitialState(), true)
})

afterEach(() => {
  localStorage.clear()
  useAppStore.setState(useAppStore.getInitialState(), true)
})

describe('ProtectedRoute', () => {
  it('redirects to the default route when unauthenticated', () => {
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route path="/" element={<div>landing</div>} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute>
                <div>secret content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('landing')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
  })

  it('redirects to custom redirectTo', () => {
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute redirectTo="/login">
                <div>secret</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    useAppStore.getState().setUser({ id: '1', name: 'A', email: 'a@b.c' })
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route
            path="/secret"
            element={
              <ProtectedRoute>
                <div>secret content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })
})
