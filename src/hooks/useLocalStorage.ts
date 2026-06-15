import { useState, useEffect, useCallback, useRef } from 'react'

function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }
  try {
    const item = globalThis.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : fallback
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error)
    return fallback
  }
}

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => readFromStorage(key, initialValue))
  const storedValueRef = useRef(storedValue)

  useEffect(() => {
    storedValueRef.current = storedValue
  }, [storedValue])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValueRef.current) : value
        setStoredValue(valueToStore)
        if (typeof window !== 'undefined') {
          globalThis.localStorage.setItem(key, JSON.stringify(valueToStore))
          globalThis.dispatchEvent(new Event('local-storage'))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key]
  )

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        globalThis.localStorage.removeItem(key)
        setStoredValue(initialValue)
        globalThis.dispatchEvent(new Event('local-storage'))
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readFromStorage(key, initialValue))
    }

    globalThis.addEventListener('storage', handleStorageChange)
    globalThis.addEventListener('local-storage', handleStorageChange)

    return () => {
      globalThis.removeEventListener('storage', handleStorageChange)
      globalThis.removeEventListener('local-storage', handleStorageChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

export default useLocalStorage
