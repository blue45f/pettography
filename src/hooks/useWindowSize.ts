import { useState, useEffect } from 'react'

interface WindowSize {
  width: number
  height: number
}

function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => ({
    width: typeof window !== 'undefined' ? globalThis.innerWidth : 0,
    height: typeof window !== 'undefined' ? globalThis.innerHeight : 0,
  }))

  useEffect(() => {
    let rafId: number

    const handleResize = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        setSize({ width: globalThis.innerWidth, height: globalThis.innerHeight })
      })
    }

    globalThis.addEventListener('resize', handleResize)
    return () => {
      globalThis.removeEventListener('resize', handleResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return size
}

export default useWindowSize
