import { useTranslation } from 'react-i18next'

import styles from './Pagination.module.css'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
  className?: string
}

function getPageRange(current: number, total: number, siblings: number): (number | 'ellipsis')[] {
  const range: (number | 'ellipsis')[] = []

  const start = Math.max(2, current - siblings)
  const end = Math.min(total - 1, current + siblings)

  range.push(1)

  if (start > 2) {
    range.push('ellipsis')
  }

  for (let i = start; i <= end; i++) {
    range.push(i)
  }

  if (end < total - 1) {
    range.push('ellipsis')
  }

  if (total > 1) {
    range.push(total)
  }

  return range
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className = '',
}: PaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  const pages = getPageRange(currentPage, totalPages, siblingCount)

  return (
    <nav className={`${styles.pagination} ${className}`} aria-label={t('pagination.nav')}>
      <span className="sr-only" aria-live="polite">
        {t('pagination.status', { total: totalPages, current: currentPage })}
      </span>
      <button
        className={styles.button}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t('pagination.previous')}
        type="button"
      >
        &lsaquo;
      </button>

      {pages.map((page, index) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            className={`${styles.button} ${currentPage === page ? styles.active : ''}`}
            onClick={() => onPageChange(page)}
            aria-current={currentPage === page ? 'page' : undefined}
            aria-label={t('pagination.pageLabel', { page })}
            type="button"
          >
            {page}
          </button>
        ),
      )}

      <button
        className={styles.button}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t('pagination.next')}
        type="button"
      >
        &rsaquo;
      </button>
    </nav>
  )
}

export default Pagination
