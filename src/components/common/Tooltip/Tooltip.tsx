import {
  useState,
  useId,
  useRef,
  useEffect,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import styles from './Tooltip.module.css'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: TooltipPosition
  delay?: number
}

function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = useId()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Escape' && isVisible) {
      hide()
    }
  }

  const triggerElement = isValidElement(children)
    ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      })
    : children

  return (
    // 트리거 자식 요소의 native focus/blur·hover·keydown으로 키보드 접근을 제공하므로
    // 정적 span을 사용한다. 인터랙션은 children(button/link 등)이 담당.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <span
      className={styles.wrapper}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
    >
      {triggerElement}
      {isVisible && (
        <span id={tooltipId} className={`${styles.tooltip} ${styles[position]}`} role="tooltip">
          {content}
          <span className={styles.arrow} />
        </span>
      )}
    </span>
  )
}

export default Tooltip
