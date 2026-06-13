import { isOnboardingComplete, useOnboardingStore } from '@domains/onboarding'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import styles from './BottomNav.module.css'

interface BottomNavItem {
  path: string
  label: string
  icon: string
}

function BottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const profile = useOnboardingStore((s) => s.profile)
  const completed = isOnboardingComplete(profile)

  const items: BottomNavItem[] = completed
    ? [
        { path: '/dashboard', label: t('nav.short.dashboard'), icon: '🏠' },
        { path: '/match', label: t('nav.short.match'), icon: '✨' },
        { path: '/consult', label: t('nav.short.consult'), icon: '💬' },
        { path: '/forum', label: t('nav.short.forum'), icon: '👥' },
        { path: '/diary', label: t('nav.short.diary'), icon: '📓' },
      ]
    : [
        { path: '/', label: t('nav.short.dashboard'), icon: '🏠' },
        { path: '/match', label: t('nav.short.match'), icon: '✨' },
        { path: '/onboarding', label: t('nav.short.onboarding'), icon: '🎯' },
        { path: '/species', label: t('nav.short.species'), icon: '🐾' },
        { path: '/hospitals', label: t('nav.short.hospitals'), icon: '🏥' },
      ]

  return (
    <nav className={styles.nav} aria-label={t('header.primaryNav')}>
      <ul className={styles.list}>
        {items.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(`${item.path}/`))
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`${styles.link} ${isActive ? styles.active : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span aria-hidden="true" className={styles.icon}>
                  {item.icon}
                </span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomNav
