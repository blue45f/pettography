import LanguageToggle from '@components/common/LanguageToggle'
import ThemeToggle from '@components/common/ThemeToggle'
import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import styles from './Header.module.css'

function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const profile = useOnboardingStore((s) => s.profile)
  const completed = isOnboardingComplete(profile)
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = completed
    ? [
        { path: '/dashboard', label: t('nav.dashboard') },
        { path: '/hospitals', label: t('nav.hospitals') },
        { path: '/shops', label: t('nav.shops') },
        { path: '/care', label: t('nav.care') },
        { path: '/adoption', label: t('nav.adoption') },
        { path: '/communities', label: t('nav.communities') },
        { path: '/funeral', label: t('nav.funeral') },
      ]
    : [
        { path: '/onboarding', label: t('nav.onboarding') },
        { path: '/hospitals', label: t('nav.hospitals') },
        { path: '/shops', label: t('nav.shops') },
      ]

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo} aria-label={t('common.appName')}>
          <span aria-hidden="true">🐾</span> {t('common.appName')}
        </Link>
        <div className={`${styles.actions} ${menuOpen ? styles.open : ''}`}>
          <nav aria-label={t('header.primaryNav')}>
            <ul className={styles.navList}>
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`${styles.navLink} ${
                      location.pathname === item.path ? styles.active : ''
                    }`}
                    aria-current={location.pathname === item.path ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? t('header.closeMenu') : t('header.openMenu')}
          aria-expanded={menuOpen}
          type="button"
        >
          <span className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`} />
        </button>
      </div>
    </header>
  )
}

export default Header
