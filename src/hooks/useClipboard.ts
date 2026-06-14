import { useState, useCallback, useEffect, useRef } from 'react'

interface UseClipboardReturn {
  copied: boolean
  copy: (text: string) => Promise<void>
  error: string | null
}

function useClipboard(resetDelay = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = useCallback(
    async (text: string) => {
      // Clear any pending reset from a previous copy
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setError(null)

        timerRef.current = setTimeout(() => {
          setCopied(false)
          timerRef.current = null
        }, resetDelay)
      } catch (err) {
        const message = err instanceof Error ? err.message : '클립보드 복사에 실패했습니다.'
        setError(message)
        setCopied(false)
      }
    },
    [resetDelay]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return { copied, copy, error }
}

export default useClipboard
