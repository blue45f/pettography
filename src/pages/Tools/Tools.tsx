import Badge from '@components/common/Badge'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import styles from './Tools.module.css'

import { ALL_TOOLS, TOOL_GROUPS } from '@/config/toolCatalog'

const TOTAL_TOOLS = ALL_TOOLS.length

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
