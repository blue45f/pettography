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

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)

    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [targetKey])

  return isPressed
}

export default useKeyPress
