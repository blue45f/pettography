import type { ReactNode } from 'react'

import { Card as KitCard } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

// The kit Card carries no padding (it expects Card.Body); the legacy Card put
// padding straight on the surface. Preserve that by mapping the legacy
// `padding` scale onto utility classes applied to the kit surface.
const PADDING_MAP: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

/**
 * Legacy common Card — now a thin wrapper over the `ui/` kit Card so existing
 * callers render the canonical kit surface without changing their API.
 * Legacy-only `padding` and `hoverable` are handled here.
 */
function Card({ children, className = '', padding = 'md', hoverable = false }: CardProps) {
  return (
    <KitCard
      className={cn(
        'overflow-hidden',
        PADDING_MAP[padding],
        hoverable &&
          'transition-shadow duration-150 ease-quint hover:-translate-y-0.5 hover:shadow-md',
        className
      )}
    >
      {children}
    </KitCard>
  )
}

interface CardSectionProps {
  children: ReactNode
  className?: string
}

function CardHeader({ children, className = '' }: CardSectionProps) {
  return <KitCard.Header className={cn(className)}>{children}</KitCard.Header>
}

function CardBody({ children, className = '' }: CardSectionProps) {
  return <KitCard.Body className={cn(className)}>{children}</KitCard.Body>
}

function CardFooter({ children, className = '' }: CardSectionProps) {
  return <KitCard.Footer className={cn(className)}>{children}</KitCard.Footer>
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
