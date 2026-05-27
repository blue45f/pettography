import { useState, useId, createElement, type ReactNode } from 'react'

import styles from './Accordion.module.css'

interface AccordionItem {
  id: string
  title: string
  content: ReactNode
  disabled?: boolean
}

interface AccordionProps {
  items: AccordionItem[]
  allowMultiple?: boolean
  defaultOpen?: string[]
  className?: string
  headingLevel?: 2 | 3 | 4 | 5 | 6
}

function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
  headingLevel = 3,
}: AccordionProps) {
  const baseId = useId()
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen))

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const HeadingTag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return (
    <div className={`${styles.accordion} ${className}`}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id)
        const headerId = `${baseId}-header-${item.id}`
        const panelId = `${baseId}-panel-${item.id}`

        return (
          <div key={item.id} className={styles.item}>
            {createElement(
              HeadingTag,
              null,
              <button
                id={headerId}
                className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={item.disabled}
                type="button"
              >
                <span>{item.title}</span>
                <span
                  className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`}
                  aria-hidden="true"
                >
                  &#x203A;
                </span>
              </button>
            )}
            <div
              id={panelId}
              className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
            >
              <div className={styles.panelInner}>
                <div className={styles.content}>{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Accordion
