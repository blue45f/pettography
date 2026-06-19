import useReducedMotion from '@hooks/useReducedMotion'
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'

import styles from './Reveal.module.css'

interface RevealProps {
  children: ReactNode
  /** Element to render. Defaults to `div`. Use `li`, `section`, etc. for valid markup. */
  as?: ElementType
  /** Entrance delay in ms, for staggering siblings. */
  delay?: number
  /** Pre-reveal transform (the "from" state). Defaults to a gentle rise. */
  from?: string
  className?: string
  style?: CSSProperties
}

/**
 * Scroll-reveal wrapper that enhances an already-visible default.
 *
 * The child content is rendered visible at all times — no JS, headless render,
 * or hidden tab can leave it blank. JS arms a subtle entrance offset only when
 * the browser supports it and motion is allowed, then an IntersectionObserver
 * plays the entrance once the element scrolls into view. Reduced-motion users
 * skip the offset entirely. Animates transform/opacity only (no layout).
 */
function Reveal({ children, as, delay = 0, from, className, style }: RevealProps) {
  const Tag = as ?? 'div'
  const ref = useRef<HTMLElement | null>(null)
  const prefersReduced = useReducedMotion()
  const [armed, setArmed] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (prefersReduced) return
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    // Arm the pre-reveal state only now that we know JS + observer are live.
    setArmed(true)

    // If the element is already at/above the fold on mount, reveal right away so
    // first-fold content never waits on a scroll that may not come.
    const rect = element.getBoundingClientRect()
    const viewportH = globalThis.innerHeight || document.documentElement.clientHeight
    if (rect.top < viewportH) {
      setShown(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(element)

    // Safety net: if the observer never fires (background tab, headless capture,
    // an element that never reaches the threshold), reveal anyway so content is
    // never left blank. The entrance still plays; it just can't get stuck.
    const fallback = globalThis.setTimeout(() => setShown(true), 1200)

    return () => {
      observer.disconnect()
      globalThis.clearTimeout(fallback)
    }
  }, [prefersReduced])

  const mergedStyle = {
    ...style,
    ...(delay ? { '--reveal-delay': `${delay}ms` } : null),
    ...(from ? { '--reveal-from': from } : null),
  } as CSSProperties

  return (
    <Tag
      ref={ref}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
      data-reveal-armed={armed ? 'true' : undefined}
      data-reveal-shown={shown ? 'true' : undefined}
      style={mergedStyle}
    >
      {children}
    </Tag>
  )
}

export default Reveal
