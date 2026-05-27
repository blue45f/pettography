import styles from './Card.module.css'

import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

function Card({ children, className = '', padding = 'md', hoverable = false }: CardProps) {
  const cardClasses = [
    styles.card,
    styles[`padding-${padding}`],
    hoverable ? styles.hoverable : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={cardClasses}>{children}</div>
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={`${styles.header} ${className}`}>{children}</div>
}

interface CardBodyProps {
  children: ReactNode
  className?: string
}

function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`${styles.body} ${className}`}>{children}</div>
}

interface CardFooterProps {
  children: ReactNode
  className?: string
}

function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
