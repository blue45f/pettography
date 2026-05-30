import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Breadcrumb.module.css'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: string
  className?: string
}

function Breadcrumb({ items, separator = '/', className = '' }: BreadcrumbProps) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('common.currentLocation')} className={`${styles.breadcrumb} ${className}`}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={item.href ?? item.label} className={styles.item}>
              {isLast || !item.href ? (
                <span className={styles.current} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className={styles.link}>
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <span className={styles.separator} aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
