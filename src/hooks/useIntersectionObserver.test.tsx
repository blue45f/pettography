import { render, act } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import useIntersectionObserver from './useIntersectionObserver'

type Cb = (entries: Partial<IntersectionObserverEntry>[]) => void

let lastCallback: Cb | null = null
let lastInit: IntersectionObserverInit | undefined
const observeMock = vi.fn()
const unobserveMock = vi.fn()
const disconnectMock = vi.fn()

beforeEach(() => {
  observeMock.mockReset()
  unobserveMock.mockReset()
  disconnectMock.mockReset()
  lastCallback = null
  lastInit = undefined

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: Cb, init?: IntersectionObserverInit) {
        lastCallback = cb
        lastInit = init
      }
      observe = observeMock
      unobserve = unobserveMock
      disconnect = disconnectMock
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

interface ProbeProps {
  options?: Parameters<typeof useIntersectionObserver>[0]
  expose?: (r: ReturnType<typeof useIntersectionObserver>) => void
}

function Probe({ options, expose }: ProbeProps) {
  const result = useIntersectionObserver(options)
  const { ref } = result
  useEffect(() => {
    expose?.(result)
  })
  return <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="probe" />
}

describe('useIntersectionObserver', () => {
  it('attaches observer with provided options', () => {
    render(<Probe options={{ threshold: 0.5, rootMargin: '10px' }} />)
    expect(observeMock).toHaveBeenCalledTimes(1)
    expect(lastInit).toMatchObject({ threshold: 0.5, rootMargin: '10px', root: null })
  })

  it('updates isIntersecting and entry when callback fires', () => {
    let captured: ReturnType<typeof useIntersectionObserver> | undefined
    render(<Probe expose={(r) => (captured = r)} />)
    expect(observeMock).toHaveBeenCalled()

    const fakeEntry = { isIntersecting: true } as IntersectionObserverEntry
    act(() => lastCallback!([fakeEntry]))

    expect(captured!.isIntersecting).toBe(true)
    expect(captured!.entry).toBe(fakeEntry)
  })

  it('unobserves after first intersection when triggerOnce is true', () => {
    render(<Probe options={{ triggerOnce: true }} />)
    act(() => lastCallback!([{ isIntersecting: true } as IntersectionObserverEntry]))
    expect(unobserveMock).toHaveBeenCalled()
  })

  it('cleans up on unmount', () => {
    const { unmount } = render(<Probe />)
    unmount()
    expect(unobserveMock).toHaveBeenCalled()
  })
})
