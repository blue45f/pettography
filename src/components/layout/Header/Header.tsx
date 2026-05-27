import LanguageToggle from '@components/common/LanguageToggle'
import ThemeToggle from '@components/common/ThemeToggle'
import { isOnboardingComplete, useOnboardingStore } from '@features/onboarding'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import styles from './Header.module.css'

interface NavItem {
  path: string
  label: string
}

function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const profile = useOnboardingStore((s) => s.profile)
  const completed = isOnboardingComplete(profile)
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLLIElement | null>(null)

  const primary: NavItem[] = completed
    ? [
        { path: '/dashboard', label: t('nav.dashboard') },
        { path: '/species', label: t('nav.species') },
        { path: '/match', label: t('nav.match') },
        { path: '/hospitals', label: t('nav.hospitals') },
        { path: '/shops', label: t('nav.shops') },
        { path: '/consult', label: t('nav.consult') },
      ]
    : [
        { path: '/match', label: t('nav.match') },
        { path: '/onboarding', label: t('nav.onboarding') },
        { path: '/species', label: t('nav.species') },
        { path: '/hospitals', label: t('nav.hospitals') },
        { path: '/shops', label: t('nav.shops') },
      ]

  const overflow: NavItem[] = completed
    ? [
        { path: '/care', label: t('nav.care') },
        { path: '/health', label: t('nav.health') },
        { path: '/habitat', label: t('nav.habitat') },
        { path: '/forum', label: t('nav.forum') },
        { path: '/diary', label: t('nav.diary') },
        { path: '/adoption', label: t('nav.adoption') },
        { path: '/communities', label: t('nav.communities') },
        { path: '/funeral', label: t('nav.funeral') },
        { path: '/resources', label: t('nav.resources') },
        { path: '/partners', label: t('nav.partners') },
        { path: '/admin', label: t('nav.admin') },
        { path: '/sos', label: t('nav.sos') },
      ]
    : [
        { path: '/forum', label: t('nav.forum') },
        { path: '/resources', label: t('nav.resources') },
        { path: '/partners', label: t('nav.partners') },
        { path: '/sos', label: t('nav.sos') },
      ]

  useEffect(() => {
    if (!moreOpen) return
    function onClick(e: MouseEvent) {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [moreOpen])

  function closeAll() {
    setMenuOpen(false)
    setMoreOpen(false)
  }

  const moreHasActive = overflow.some((i) => location.pathname === i.path)

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo} aria-label={t('common.appName')}>
          <span aria-hidden="true">🐾</span> {t('common.appName')}
        </Link>
        <Link to="/sos" className={styles.sosChip} aria-label={t('nav.sos')}>
          {t('nav.sos')}
        </Link>
        <div className={`${styles.actions} ${menuOpen ? styles.open : ''}`}>
          <nav aria-label={t('header.primaryNav')}>
            <ul className={styles.navList}>
              {primary.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={closeAll}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
              {overflow.length > 0 && (
                <li className={styles.moreItem} ref={moreRef}>
                  <button
                    type="button"
                    className={`${styles.navLink} ${styles.moreButton} ${
                      moreHasActive || moreOpen ? styles.active : ''
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen((prev) => !prev)}
                  >
                    {t('header.more')} ▾
                  </button>
                  {moreOpen && (
                    <div className={styles.moreMenu} role="menu" aria-label={t('header.moreLabel')}>
                      {overflow.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            role="menuitem"
                            className={`${styles.moreLink} ${isActive ? styles.moreLinkActive : ''}`}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={closeAll}
                          >
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </li>
              )}
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
