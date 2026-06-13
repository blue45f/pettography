import { type ReactNode } from 'react'

import { Accordion as KitAccordion } from '@/components/ui/Accordion'
import { cn } from '@/utils/cn'

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

/**
 * Legacy common Accordion — now a thin wrapper over the `ui/` kit Accordion
 * (Radix) so existing callers render the canonical kit styling without changing
 * their data-driven API. The kit owns the heading/trigger/region roles,
 * `aria-expanded`/`aria-controls` wiring and keyboard navigation the legacy
 * implemented by hand. Item `id`s map to Radix `value`s; `allowMultiple` picks
 * the Radix `single` (collapsible) vs `multiple` variant; `defaultOpen` seeds
 * the matching `defaultValue` shape.
 */
function Accordion({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className = '',
  headingLevel = 3,
}: AccordionProps) {
  const triggers = items.map((item) => (
    <KitAccordion.Item key={item.id} value={item.id} disabled={item.disabled}>
      <KitAccordion.Trigger headingLevel={headingLevel}>{item.title}</KitAccordion.Trigger>
      <KitAccordion.Content>{item.content}</KitAccordion.Content>
    </KitAccordion.Item>
  ))

  // Radix `Root` is a discriminated union on `type`; the two branches take
  // differently-shaped value props, so render each explicitly.
  if (allowMultiple) {
    return (
      <KitAccordion type="multiple" defaultValue={defaultOpen} className={cn(className)}>
        {triggers}
      </KitAccordion>
    )
  }

  return (
    <KitAccordion type="single" collapsible defaultValue={defaultOpen[0]} className={cn(className)}>
      {triggers}
    </KitAccordion>
  )
}

export default Accordion
