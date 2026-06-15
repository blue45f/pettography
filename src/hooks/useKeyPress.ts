import { useState, useEffect } from 'react'

function useKeyPress(targetKey: string): boolean {
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === targetKey) setIsPressed(true)
    }

    const handleUp = (e: KeyboardEvent) => {
      if (e.key === targetKey) setIsPressed(false)
    }

    globalThis.addEventListener('keydown', handleDown)
    globalThis.addEventListener('keyup', handleUp)

    return () => {
      globalThis.removeEventListener('keydown', handleDown)
      globalThis.removeEventListener('keyup', handleUp)
    }
  }, [targetKey])

  return isPressed
}

export default useKeyPress
