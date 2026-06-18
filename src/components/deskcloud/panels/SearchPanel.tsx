/**
 * SearchPanel — SearchDesk 네이티브 검색.
 * ──────────────────────────────────────────────────────────────────────────
 * @heejun/deskcloud 의 SearchClient.search 로 전문 검색을 호출하고, 서버가
 * 돌려준 하이라이트(<mark>) 마크업을 앱 토큰으로 스타일링해 렌더한다.
 * 앱 자체 ⌘K 커맨드 팔레트(코어)는 그대로 유지 — 이 패널은 보조 콘텐츠 검색.
 */
import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import Input from '@components/common/Input'
import Skeleton from '@components/common/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getSearchClient } from '../clients'
import styles from '../DeskCloud.module.css'

export default function SearchPanel() {
  const { t } = useTranslation()
  const client = getSearchClient()
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['deskcloud', 'search', query],
    enabled: client !== null && query.trim().length > 0,
    retry: false,
    queryFn: async () => {
      if (!client) return null
      return client.search({ q: query, limit: 20 })
    },
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <form
        className={styles.searchForm}
        onSubmit={(e) => {
          e.preventDefault()
          setQuery(draft)
        }}
      >
        <div className={styles.searchInput}>
          <Input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('search.placeholder', '검색어를 입력하세요')}
            aria-label={t('search.label', '콘텐츠 검색')}
          />
        </div>
        <Button type="submit" disabled={draft.trim().length === 0}>
          {t('search.submit', '검색')}
        </Button>
      </form>

      {(isLoading || isFetching) && query && <Skeleton lines={4} />}

      {isError && (
        <EmptyState
          icon="📭"
          title={t('search.errorTitle', '검색에 실패했어요')}
          variant="discover"
        />
      )}

      {data && data.hits.length === 0 && (
        <EmptyState
          icon="🔍"
          title={t('search.emptyTitle', '결과가 없어요')}
          description={t('search.emptyDesc', '다른 검색어로 다시 시도해 보세요.')}
          variant="discover"
        />
      )}

      {data && data.hits.length > 0 && (
        <ul className={styles.list}>
          {data.hits.map((hit) => {
            const Tag = hit.url ? 'a' : 'div'
            return (
              <li key={hit.id}>
                <Tag
                  className={styles.hit}
                  {...(hit.url ? { href: hit.url } : {})}
                >
                  {/* 서버가 만든 하이라이트(<mark>) 마크업만 렌더. */}
                  <span
                    className={styles.hitTitle}
                    dangerouslySetInnerHTML={{ __html: hit.titleHighlight || hit.title }}
                  />
                  {hit.snippet && (
                    <span
                      className={styles.hitSnippet}
                      dangerouslySetInnerHTML={{ __html: hit.snippet }}
                    />
                  )}
                </Tag>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
