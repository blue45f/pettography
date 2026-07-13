import { LINK_CATEGORIES, useExternalLinks, type LinkCategory } from '@domains/external-links'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Resources.module.css'

const COPY = {
  ko: {
    title: '신뢰할 수 있는 출처',
    subtitle: '구매 순위 대신 정부·대학병원·수의학 원문으로 다음 행동을 확인하세요.',
    noticeTitle: '링크는 출발점입니다',
    notice:
      '기관 운영, 진료 종, 비용, 법령은 바뀔 수 있습니다. 의료·입양·장례 결정을 내리기 전에 해당 기관에 직접 확인하세요.',
    search: '기관 또는 주제 검색',
    all: '전체',
    count: '{{shown}}개 출처',
    retry: '다시 불러오기',
    loading: '공식 출처를 불러오는 중입니다.',
    error: '출처를 불러오지 못했습니다.',
    empty: '조건에 맞는 출처가 없습니다.',
    open: '공식 페이지 열기',
    region: '범위',
    categories: {
      adoption: '입양·보호',
      medical: '의료',
      funeral: '장례·등록 확인',
      reference: '법령·전문 자료',
      shopping: '쇼핑',
      community: '커뮤니티',
    },
  },
  en: {
    title: 'Trusted sources',
    subtitle: 'Use government, university hospital, and veterinary references instead of rankings.',
    noticeTitle: 'Links are a starting point',
    notice:
      'Operations, species coverage, fees, and laws can change. Confirm directly before medical, adoption, or funeral decisions.',
    search: 'Search an organization or topic',
    all: 'All',
    count: '{{shown}} sources',
    retry: 'Try again',
    loading: 'Loading trusted sources.',
    error: 'Sources could not be loaded.',
    empty: 'No sources match these filters.',
    open: 'Open official page',
    region: 'Coverage',
    categories: {
      adoption: 'Adoption & shelter',
      medical: 'Medical',
      funeral: 'Funeral & registration',
      reference: 'Law & expert reference',
      shopping: 'Shopping',
      community: 'Community',
    },
  },
  ja: {
    title: '信頼できる情報源',
    subtitle: 'ランキングではなく、政府・大学病院・獣医学の原文から次の行動を確認できます。',
    noticeTitle: 'リンクは出発点です',
    notice:
      '運営状況、診療対象、費用、法令は変わる場合があります。医療・譲渡・葬儀の判断前に各機関へ直接ご確認ください。',
    search: '機関・テーマを検索',
    all: 'すべて',
    count: '{{shown}}件',
    retry: '再読み込み',
    loading: '公式情報源を読み込んでいます。',
    error: '情報源を読み込めませんでした。',
    empty: '条件に合う情報源がありません。',
    open: '公式ページを開く',
    region: '対象',
    categories: {
      adoption: '譲渡・保護',
      medical: '医療',
      funeral: '葬儀・登録確認',
      reference: '法令・専門資料',
      shopping: 'ショッピング',
      community: 'コミュニティ',
    },
  },
} as const

interface LocalizedLinkCopy {
  name: string
  description: string
  region?: string
  badge?: string
}

const LINK_COPY: Record<'en' | 'ja', Record<string, LocalizedLinkCopy>> = {
  en: {
    'official-protected-animals': {
      name: 'National Animal Protection Information System: Sheltered Animals',
      description:
        'The Korean government system for viewing rescue and shelter notices and animals eligible for adoption.',
      region: 'Online across Korea',
      badge: 'Government',
    },
    'official-animal-hospitals': {
      name: 'National Animal Protection Information System: Veterinary Clinics',
      description:
        'Search local government licensing records for clinics across Korea. Call ahead to confirm species coverage and opening hours.',
      region: 'Online across Korea',
      badge: 'Government',
    },
    'snu-special-animals': {
      name: 'Seoul National University VMTH: Wildlife and Exotic Animals',
      description:
        'Official information about care for birds, reptiles, rabbits, hamsters, and other exotic animals, including referral guidance.',
      region: 'Gwanak-gu, Seoul',
      badge: 'University hospital',
    },
    'official-animal-businesses': {
      name: 'National Animal Protection Information System: Licensed Pet Businesses',
      description:
        'Search licensed pet businesses, including animal funeral providers, by location and category before entering a contract.',
      region: 'Online across Korea',
      badge: 'Government',
    },
    'official-animal-law': {
      name: 'Korean Law Information Center: Animal Protection Act',
      description:
        'The official current text of Korea’s Animal Protection Act and its subordinate statutes.',
      region: 'Online across Korea',
      badge: 'Government',
    },
    'msd-reptile-husbandry': {
      name: 'MSD Veterinary Manual: Reptile Husbandry',
      description:
        'A veterinary overview of reptile environment, temperature, humidity, lighting, and hygiene. Use it as preparation for species-specific veterinary advice.',
      region: 'English online',
      badge: 'Veterinary reference',
    },
    'msd-reptile-nutrition': {
      name: 'MSD Veterinary Manual: Reptile Nutrition',
      description:
        'A veterinary overview of reptile nutrition and supplementation. Discuss species, life stage, and illness-specific decisions with a veterinarian.',
      region: 'English online',
      badge: 'Veterinary reference',
    },
  },
  ja: {
    'official-protected-animals': {
      name: '国家動物保護情報システム 保護動物検索',
      description:
        '自治体の保護施設にいる救助・保護動物の公告と譲渡対象情報を確認できる韓国政府の公式システムです。',
      region: '韓国全国・オンライン',
      badge: '政府公式',
    },
    'official-animal-hospitals': {
      name: '国家動物保護情報システム 全国動物病院検索',
      description:
        '自治体の許認可情報から韓国全国の動物病院を検索できます。対象動物と診療時間は来院前に電話で確認してください。',
      region: '韓国全国・オンライン',
      badge: '政府公式',
    },
    'snu-special-animals': {
      name: 'ソウル大学動物病院 野生動物・特殊動物科',
      description:
        '鳥類、爬虫類、ウサギ、ハムスターなどの診療対象と予約・紹介受診の案内を確認できます。',
      region: 'ソウル市冠岳区',
      badge: '大学病院公式',
    },
    'official-animal-businesses': {
      name: '国家動物保護情報システム ペット関連事業者検索',
      description:
        '動物葬祭業を含む許認可事業者を地域・業種別に検索できます。契約前に登録状態を確認してください。',
      region: '韓国全国・オンライン',
      badge: '政府公式',
    },
    'official-animal-law': {
      name: '国家法令情報センター 動物保護法',
      description: '韓国の現行動物保護法と施行令・施行規則を原文で確認できる公式ページです。',
      region: '韓国全国・オンライン',
      badge: '政府公式',
    },
    'msd-reptile-husbandry': {
      name: 'MSD Veterinary Manual: 爬虫類の飼育管理',
      description:
        '環境、温度、湿度、照明、衛生に関する獣医学的概要です。種別の診療相談を準備する参考資料として利用してください。',
      region: '英語・オンライン',
      badge: '獣医学参考',
    },
    'msd-reptile-nutrition': {
      name: 'MSD Veterinary Manual: 爬虫類の栄養',
      description:
        '爬虫類の栄養とサプリメントに関する獣医学的概要です。種、成長段階、疾患に応じた判断は獣医師に相談してください。',
      region: '英語・オンライン',
      badge: '獣医学参考',
    },
  },
}

function localizedLink(language: string, id: string): LocalizedLinkCopy | undefined {
  if (language !== 'en' && language !== 'ja') return undefined
  return LINK_COPY[language][id]
}

function Resources() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.split('-')[0] as keyof typeof COPY
  const copy = COPY[language] ?? COPY.ko
  useDocumentTitle(copy.title)

  const { data = [], isLoading, isError, refetch, isFetching } = useExternalLinks({})
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<LinkCategory | 'all'>('all')
  const availableCategories = useMemo(
    () => LINK_CATEGORIES.filter((item) => data.some((link) => link.category === item)),
    [data]
  )
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return data.filter((link) => {
      if (category !== 'all' && link.category !== category) return false
      if (!needle) return true
      const localized = localizedLink(language, link.id)
      return `${localized?.name ?? link.name} ${localized?.description ?? link.description} ${localized?.region ?? link.region ?? ''}`
        .toLocaleLowerCase()
        .includes(needle)
    })
  }, [category, data, language, query])

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>CURATED SOURCES</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </header>

      <aside className={styles.notice} aria-labelledby="resource-notice-title">
        <span aria-hidden="true">i</span>
        <div>
          <h2 id="resource-notice-title">{copy.noticeTitle}</h2>
          <p>{copy.notice}</p>
        </div>
      </aside>

      <div className={styles.toolbar}>
        <label className={styles.search}>
          <span className="sr-only">{copy.search}</span>
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
            type="search"
          />
        </label>
        <span className={styles.count} aria-live="polite">
          {copy.count.replace('{{shown}}', String(visible.length))}
        </span>
      </div>

      <div className={styles.filters} aria-label={copy.title}>
        <button
          type="button"
          aria-pressed={category === 'all'}
          className={category === 'all' ? styles.active : undefined}
          onClick={() => setCategory('all')}
        >
          {copy.all}
        </button>
        {availableCategories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            className={category === item ? styles.active : undefined}
            onClick={() => setCategory(item)}
          >
            {copy.categories[item]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className={styles.state} aria-live="polite">
          {copy.loading}
        </div>
      ) : null}
      {isError ? (
        <div className={styles.state} role="alert">
          <p>{copy.error}</p>
          <button type="button" onClick={() => void refetch()} disabled={isFetching}>
            {copy.retry}
          </button>
        </div>
      ) : null}
      {!isLoading && !isError && visible.length === 0 ? (
        <div className={styles.state}>{copy.empty}</div>
      ) : null}

      {!isLoading && !isError && visible.length > 0 ? (
        <ul className={styles.grid}>
          {visible.map((link) => {
            const localized = localizedLink(language, link.id)
            const region = localized?.region ?? link.region
            const badge = localized?.badge ?? link.badge
            return (
              <li key={link.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.category}>{copy.categories[link.category]}</span>
                  {badge ? <span className={styles.badge}>{badge}</span> : null}
                </div>
                <h2>{localized?.name ?? link.name}</h2>
                <p>{localized?.description ?? link.description}</p>
                {region ? (
                  <dl>
                    <dt>{copy.region}</dt>
                    <dd>{region}</dd>
                  </dl>
                ) : null}
                <a href={link.url} target="_blank" rel="noreferrer noopener">
                  {copy.open}
                  <span aria-hidden="true">↗</span>
                </a>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

export default Resources
