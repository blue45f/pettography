import { useState, useEffect } from 'react'

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    globalThis.addEventListener('online', handleOnline)
    globalThis.addEventListener('offline', handleOffline)

    return () => {
      globalThis.removeEventListener('online', handleOnline)
      globalThis.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export default useOnlineStatus
