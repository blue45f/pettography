import useDocumentTitle from '@hooks/useDocumentTitle'
import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Sitemap.module.css'

interface SiteLink {
  to: string
  labelKey: string
}

interface SiteGroup {
  key: string
  links: SiteLink[]
}

const SITE_GROUPS: SiteGroup[] = [
  {
    key: 'start',
    links: [
      { to: '/', labelKey: 'sitemap.home' },
      { to: '/onboarding', labelKey: 'nav.onboarding' },
      { to: '/dashboard', labelKey: 'nav.dashboard' },
      { to: '/species', labelKey: 'nav.species' },
      { to: '/match', labelKey: 'nav.match' },
      { to: '/compare', labelKey: 'nav.compare' },
      { to: '/herd', labelKey: 'nav.herd' },
      { to: '/care', labelKey: 'nav.care' },
      { to: '/caresheet', labelKey: 'nav.caresheet' },
      { to: '/tools', labelKey: 'nav.tools' },
      { to: '/assistant', labelKey: 'nav.assistant' },
    ],
  },
  {
    key: 'daily',
    links: [
      { to: '/diary', labelKey: 'nav.diary' },
      { to: '/routine', labelKey: 'nav.routine' },
      { to: '/calendar', labelKey: 'nav.calendar' },
      { to: '/alerts', labelKey: 'nav.alerts' },
      { to: '/feeding', labelKey: 'nav.feeding' },
      { to: '/cleaning', labelKey: 'nav.cleaning' },
      { to: '/habitat', labelKey: 'nav.habitat' },
      { to: '/lighting', labelKey: 'nav.lighting' },
      { to: '/water', labelKey: 'nav.water' },
      { to: '/health', labelKey: 'nav.health' },
      { to: '/growth', labelKey: 'nav.growth' },
      { to: '/bcs', labelKey: 'nav.bcs' },
      { to: '/vitals', labelKey: 'nav.vitals' },
      { to: '/meds', labelKey: 'nav.meds' },
      { to: '/molt', labelKey: 'nav.molt' },
      { to: '/supplements', labelKey: 'nav.supplements' },
      { to: '/feeders', labelKey: 'nav.feeders' },
    ],
  },
  {
    key: 'planning',
    links: [
      { to: '/setup', labelKey: 'nav.setup' },
      { to: '/enclosure', labelKey: 'nav.enclosure' },
      { to: '/vivarium', labelKey: 'nav.vivarium' },
      { to: '/gear', labelKey: 'nav.gear' },
      { to: '/supplies', labelKey: 'nav.supplies' },
      { to: '/budget', labelKey: 'nav.budget' },
      { to: '/costreport', labelKey: 'nav.costreport' },
      { to: '/insurance', labelKey: 'nav.insurance' },
      { to: '/wishlist', labelKey: 'nav.wishlist' },
      { to: '/transport', labelKey: 'nav.transport' },
      { to: '/safety', labelKey: 'nav.safety' },
      { to: '/kit', labelKey: 'nav.kit' },
      { to: '/seasonal', labelKey: 'nav.seasonal' },
      { to: '/cohab', labelKey: 'nav.cohab' },
      { to: '/taming', labelKey: 'nav.taming' },
    ],
  },
  {
    key: 'lifecycle',
    links: [
      { to: '/breeding', labelKey: 'nav.breeding' },
      { to: '/genetics', labelKey: 'nav.genetics' },
      { to: '/lineage', labelKey: 'nav.lineage' },
      { to: '/brumation', labelKey: 'nav.brumation' },
      { to: '/senior', labelKey: 'nav.senior' },
      { to: '/passport', labelKey: 'nav.passport' },
      { to: '/petid', labelKey: 'nav.petid' },
      { to: '/funeral', labelKey: 'nav.funeral' },
    ],
  },
  {
    key: 'community',
    links: [
      { to: '/hospitals', labelKey: 'nav.hospitals' },
      { to: '/shops', labelKey: 'nav.shops' },
      { to: '/communities', labelKey: 'nav.communities' },
      { to: '/cafes', labelKey: 'nav.cafes' },
      { to: '/forum', labelKey: 'nav.forum' },
      { to: '/qna', labelKey: 'nav.qna' },
      { to: '/meetups', labelKey: 'nav.meetups' },
      { to: '/market', labelKey: 'nav.market' },
      { to: '/adoption', labelKey: 'nav.adoption' },
      { to: '/consult', labelKey: 'nav.consult' },
      { to: '/events', labelKey: 'nav.events' },
      { to: '/showcase', labelKey: 'nav.showcase' },
      { to: '/partners', labelKey: 'nav.partners' },
    ],
  },
  {
    key: 'learn',
    links: [
      { to: '/food', labelKey: 'nav.food' },
      { to: '/resources', labelKey: 'nav.resources' },
      { to: '/registry', labelKey: 'nav.registry' },
      { to: '/morphs', labelKey: 'nav.morphs' },
      { to: '/backup', labelKey: 'nav.backup' },
      { to: '/faq', labelKey: 'footer.faq' },
      { to: '/about', labelKey: 'footer.about' },
      { to: '/support', labelKey: 'footer.support' },
      { to: '/contact', labelKey: 'footer.contact' },
      { to: '/terms', labelKey: 'footer.terms' },
      { to: '/privacy', labelKey: 'footer.privacy' },
    ],
  },
]

function Sitemap() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  useDocumentTitle(t('sitemap.title'))

  const visibleGroups = useMemo(() => {
    const normalized = deferredQuery.trim().toLocaleLowerCase()
    return SITE_GROUPS.map((group) => ({
      ...group,
      links: group.links.filter((link) => {
        if (!normalized) return true
        const label = t(link.labelKey).toLocaleLowerCase()
        return label.includes(normalized) || link.to.toLocaleLowerCase().includes(normalized)
      }),
    })).filter((group) => group.links.length > 0)
  }, [deferredQuery, t])

  const resultCount = visibleGroups.reduce((total, group) => total + group.links.length, 0)

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('sitemap.eyebrow')}</p>
        <h1>{t('sitemap.title')}</h1>
        <p>{t('sitemap.subtitle')}</p>
      </header>

      <div className={styles.searchPanel} role="search">
        <label htmlFor="sitemap-search">{t('sitemap.searchLabel')}</label>
        <div className={styles.searchRow}>
          <input
            id="sitemap-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('sitemap.searchPlaceholder')}
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}>
              {t('sitemap.clear')}
            </button>
          )}
        </div>
        <p className={styles.resultCount} role="status">
          {t('sitemap.resultCount', { count: resultCount })}
        </p>
      </div>

      {visibleGroups.length > 0 ? (
        <div className={styles.groups}>
          {visibleGroups.map((group) => (
            <section
              key={group.key}
              className={styles.group}
              aria-labelledby={`sitemap-${group.key}`}
            >
              <div className={styles.groupHead}>
                <h2 id={`sitemap-${group.key}`}>{t(`sitemap.groups.${group.key}`)}</h2>
                <span>{group.links.length}</span>
              </div>
              <ul>
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>
                      <span>{t(link.labelKey)}</span>
                      <code>{link.to}</code>
                      <span className={styles.arrow} aria-hidden="true">
                        &rarr;
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className={styles.empty} role="status">
          <h2>{t('sitemap.emptyTitle')}</h2>
          <p>{t('sitemap.emptyDesc')}</p>
          <button type="button" onClick={() => setQuery('')}>
            {t('sitemap.clear')}
          </button>
        </div>
      )}
    </section>
  )
}

export default Sitemap
