import Button from '@components/common/Button'
import EmptyState from '@components/common/EmptyState'
import Skeleton from '@components/common/Skeleton'
import {
  parsePolicyBody,
  policyPublicUrl,
  usePolicy,
  type PolicyBlock,
  type PolicySlug,
} from '@features/policies'
import usePageMeta from '@hooks/usePageMeta'
import { createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import styles from './Policy.module.css'

/** 신뢰 표면에 노출하는 content hash 축약 길이(앞 12자). */
const SHORT_HASH_LENGTH = 12

function formatPolicyDate(value: string, language: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })
}

function PolicyBody({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <div className={styles.body}>
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          return createElement(
            `h${block.level}`,
            { key: index, className: styles.bodyHeading },
            block.text
          )
        }
        if (block.kind === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag key={index} className={styles.bodyList}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ListTag>
          )
        }
        if (block.kind === 'divider') {
          return <hr key={index} className={styles.divider} />
        }
        return (
          <p key={index} className={styles.bodyParagraph}>
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

function Policy() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()

  const isPrivacy = pathname === '/privacy'
  const slug: PolicySlug = isPrivacy ? 'privacy-policy' : 'terms-of-service'
  const fallbackTitle = isPrivacy ? t('policy.privacyTitle') : t('policy.termsTitle')

  const { data, isPending, isError, refetch } = usePolicy(slug)

  usePageMeta({
    title: `${data?.name ?? fallbackTitle} · ${t('common.appName')}`,
    description: isPrivacy ? t('pageMeta.privacyDescription') : t('pageMeta.termsDescription'),
    path: isPrivacy ? '/privacy' : '/terms',
  })

  const externalUrl = policyPublicUrl(slug)

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('policy.eyebrow')}</p>
        <h1 className={styles.title}>{data?.name ?? fallbackTitle}</h1>
      </header>

      {isPending && (
        <div className={styles.skeletonGroup}>
          <Skeleton variant="text" lines={3} />
          <Skeleton variant="text" lines={4} />
          <Skeleton variant="text" lines={4} />
        </div>
      )}

      {isError && (
        <EmptyState
          variant="gated"
          icon="📄"
          title={t('policy.errorTitle')}
          description={t('policy.errorBody')}
          hint={t('policy.errorHint')}
          action={
            <div className={styles.errorActions}>
              <Button type="button" variant="secondary" onClick={() => void refetch()}>
                {t('common.retry')}
              </Button>
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.externalLink}
              >
                {t('policy.openOnTermsDesk')} ↗
              </a>
            </div>
          }
        />
      )}

      {data && (
        <>
          <PolicyBody blocks={parsePolicyBody(data.body)} />

          <footer className={styles.trust}>
            <dl className={styles.trustList}>
              <div className={styles.trustItem}>
                <dt>{t('policy.versionLabel')}</dt>
                <dd>{data.versionLabel}</dd>
              </div>
              {data.effectiveAt && (
                <div className={styles.trustItem}>
                  <dt>{t('policy.effectiveAtLabel')}</dt>
                  <dd>{formatPolicyDate(data.effectiveAt, i18n.language)}</dd>
                </div>
              )}
              <div className={styles.trustItem}>
                <dt>{t('policy.hashLabel')}</dt>
                <dd>
                  <code className={styles.hash} title={data.contentHash}>
                    {data.contentHash.slice(0, SHORT_HASH_LENGTH)}
                  </code>
                </dd>
              </div>
            </dl>
            {data.changeSummary && (
              <p className={styles.changeSummary}>
                {t('policy.changeSummaryLabel')}: {data.changeSummary}
              </p>
            )}
            <p className={styles.sourceNote}>
              <a
                href={externalUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.externalLink}
              >
                {t('policy.openOnTermsDesk')} ↗
              </a>
            </p>
          </footer>
        </>
      )}

      <footer className={styles.pageFooter}>
        <Link to="/" className={styles.footerLink}>
          ← {t('about.backHome')}
        </Link>
        <Link to={isPrivacy ? '/terms' : '/privacy'} className={styles.footerLink}>
          {isPrivacy ? t('policy.termsTitle') : t('policy.privacyTitle')} →
        </Link>
      </footer>
    </article>
  )
}

export default Policy
