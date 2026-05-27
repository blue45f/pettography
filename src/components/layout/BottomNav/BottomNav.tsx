import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
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
        { path: '/dashboard', label: t('nav.dashboard'), icon: '🏠' },
        { path: '/match', label: t('nav.match'), icon: '✨' },
        { path: '/consult', label: t('nav.consult'), icon: '💬' },
        { path: '/forum', label: t('nav.forum'), icon: '👥' },
        { path: '/diary', label: t('nav.diary'), icon: '📓' },
      ]
    : [
        { path: '/', label: t('nav.dashboard'), icon: '🏠' },
        { path: '/match', label: t('nav.match'), icon: '✨' },
        { path: '/onboarding', label: t('nav.onboarding'), icon: '🎯' },
        { path: '/species', label: t('nav.species'), icon: '🐾' },
        { path: '/hospitals', label: t('nav.hospitals'), icon: '🏥' },
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
