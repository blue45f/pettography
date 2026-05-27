import { useState, useEffect, useRef, type RefObject } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
  triggerOnce?: boolean
}

interface UseIntersectionObserverReturn {
  ref: RefObject<Element | null>
  isIntersecting: boolean
  entry: IntersectionObserverEntry | null
}

function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { threshold = 0, rootMargin = '0px', root = null, triggerOnce = false } = options
  const ref = useRef<Element | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([observerEntry]) => {
        setIsIntersecting(observerEntry.isIntersecting)
        setEntry(observerEntry)

        if (triggerOnce && observerEntry.isIntersecting) {
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin, root }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, root, triggerOnce])

  return { ref, isIntersecting, entry }
}

export default useIntersectionObserver
