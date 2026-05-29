import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Tools.module.css'

interface ToolEntry {
  path: string
  navKey: string
}

interface ToolGroup {
  id: string
  emoji: string
  tools: ToolEntry[]
}

/** Curated catalog: every meaningful care tool, grouped for discovery. Labels reuse `nav.*`. */
const TOOL_GROUPS: readonly ToolGroup[] = [
  {
    id: 'genetics',
    emoji: '🧬',
    tools: [
      { path: '/genetics', navKey: 'genetics' },
      { path: '/breeding', navKey: 'breeding' },
      { path: '/lineage', navKey: 'lineage' },
      { path: '/morphs', navKey: 'morphs' },
    ],
  },
  {
    id: 'habitat',
    emoji: '🏡',
    tools: [
      { path: '/vivarium', navKey: 'vivarium' },
      { path: '/enclosure', navKey: 'enclosure' },
      { path: '/lighting', navKey: 'lighting' },
      { path: '/water', navKey: 'water' },
      { path: '/gear', navKey: 'gear' },
      { path: '/habitat', navKey: 'habitat' },
      { path: '/brumation', navKey: 'brumation' },
      { path: '/seasonal', navKey: 'seasonal' },
    ],
  },
  {
    id: 'feeding',
    emoji: '🍽️',
    tools: [
      { path: '/feeding', navKey: 'feeding' },
      { path: '/food', navKey: 'food' },
      { path: '/supplements', navKey: 'supplements' },
      { path: '/feeders', navKey: 'feeders' },
    ],
  },
  {
    id: 'health',
    emoji: '❤️',
    tools: [
      { path: '/health', navKey: 'health' },
      { path: '/growth', navKey: 'growth' },
      { path: '/bcs', navKey: 'bcs' },
      { path: '/vitals', navKey: 'vitals' },
      { path: '/meds', navKey: 'meds' },
      { path: '/molt', navKey: 'molt' },
      { path: '/senior', navKey: 'senior' },
    ],
  },
  {
    id: 'daily',
    emoji: '🗓️',
    tools: [
      { path: '/diary', navKey: 'diary' },
      { path: '/routine', navKey: 'routine' },
      { path: '/calendar', navKey: 'calendar' },
      { path: '/cleaning', navKey: 'cleaning' },
      { path: '/alerts', navKey: 'alerts' },
      { path: '/passport', navKey: 'passport' },
    ],
  },
  {
    id: 'safety',
    emoji: '🛟',
    tools: [
      { path: '/safety', navKey: 'safety' },
      { path: '/kit', navKey: 'kit' },
      { path: '/transport', navKey: 'transport' },
      { path: '/cohab', navKey: 'cohab' },
      { path: '/taming', navKey: 'taming' },
      { path: '/sos', navKey: 'sos' },
    ],
  },
  {
    id: 'finance',
    emoji: '💰',
    tools: [
      { path: '/budget', navKey: 'budget' },
      { path: '/costreport', navKey: 'costreport' },
      { path: '/insurance', navKey: 'insurance' },
      { path: '/supplies', navKey: 'supplies' },
      { path: '/wishlist', navKey: 'wishlist' },
      { path: '/setup', navKey: 'setup' },
    ],
  },
  {
    id: 'community',
    emoji: '👥',
    tools: [
      { path: '/forum', navKey: 'forum' },
      { path: '/qna', navKey: 'qna' },
      { path: '/showcase', navKey: 'showcase' },
      { path: '/meetups', navKey: 'meetups' },
      { path: '/market', navKey: 'market' },
      { path: '/communities', navKey: 'communities' },
      { path: '/consult', navKey: 'consult' },
      { path: '/adoption', navKey: 'adoption' },
    ],
  },
  {
    id: 'discover',
    emoji: '🔎',
    tools: [
      { path: '/species', navKey: 'species' },
      { path: '/compare', navKey: 'compare' },
      { path: '/match', navKey: 'match' },
      { path: '/care', navKey: 'care' },
      { path: '/assistant', navKey: 'assistant' },
      { path: '/hospitals', navKey: 'hospitals' },
      { path: '/shops', navKey: 'shops' },
      { path: '/resources', navKey: 'resources' },
      { path: '/events', navKey: 'events' },
    ],
  },
  {
    id: 'records',
    emoji: '🗂️',
    tools: [
      { path: '/registry', navKey: 'registry' },
      { path: '/petid', navKey: 'petid' },
      { path: '/backup', navKey: 'backup' },
      { path: '/funeral', navKey: 'funeral' },
      { path: '/partners', navKey: 'partners' },
    ],
  },
] as const

const TOTAL_TOOLS = TOOL_GROUPS.reduce((sum, group) => sum + group.tools.length, 0)

function Tools() {
  const { t } = useTranslation()
  useDocumentTitle(t('tools.title'))

  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)

  const groups = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return TOOL_GROUPS.map((group) => ({
      id: group.id,
      emoji: group.emoji,
      items: group.tools
        .map((tool) => ({ path: tool.path, label: t(`nav.${tool.navKey}`) }))
        .filter((tool) => !q || tool.label.toLowerCase().includes(q) || tool.path.includes(q)),
    })).filter((group) => group.items.length > 0)
  }, [deferredQuery, t])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>{t('tools.title')}</h1>
        <p className={styles.subtitle}>{t('tools.subtitle')}</p>
        <Badge variant="primary">{t('tools.count', { count: TOTAL_TOOLS })}</Badge>
      </header>

      <div className={styles.controls}>
        <Input
          type="search"
          placeholder={t('tools.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('tools.searchPlaceholder')}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="🔍" title={t('tools.emptyTitle')} description={t('tools.emptyDesc')} />
      ) : (
        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.id} className={styles.group} aria-labelledby={`tools-${group.id}`}>
              <h2 id={`tools-${group.id}`} className={styles.groupTitle}>
                <span className={styles.groupEmoji} aria-hidden="true">
                  {group.emoji}
                </span>
                <span>{t(`tools.groups.${group.id}`)}</span>
                <span className={styles.groupCount}>
                  {t('tools.groupCount', { count: group.items.length })}
                </span>
              </h2>
              <ul className={styles.grid}>
                {group.items.map((tool) => (
                  <li key={tool.path}>
                    <Link to={tool.path} className={styles.tile}>
                      <span className={styles.tileLabel}>{tool.label}</span>
                      <span className={styles.tileArrow} aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

export default Tools
