import { PET_EVENTS_2026, daysUntil } from '@domains/events'
import useDocumentTitle from '@hooks/useDocumentTitle'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './Events.module.css'

type RegionFilter = 'all' | (typeof PET_EVENTS_2026)[number]['region']

const COPY = {
  ko: {
    title: '공식 행사 일정',
    subtitle: '주최사 공식 페이지에서 확인한 반려동물 박람회만 모았습니다.',
    checked: '출처 확인',
    cautionTitle: '예약과 이동 전 다시 확인하세요',
    caution:
      '행사 일정, 입장료, 동반 가능 동물과 이동장 규정은 예고 없이 바뀔 수 있습니다. 결제하거나 출발하기 전에 반드시 공식 페이지를 확인하세요.',
    all: '전체 지역',
    upcoming: '예정',
    today: '오늘 시작',
    ongoing: '진행 중',
    ended: '종료',
    days: '{{count}}일 남음',
    date: '일정',
    venue: '장소',
    official: '공식 페이지에서 최신 정보 확인',
    empty: '선택한 지역의 확인된 행사가 없습니다.',
    source: '공식 주최사 페이지 기준',
    regions: { 서울: '서울', 고양: '고양', 수원: '수원' },
    events: {
      'kpet-seoul-2026': {
        name: '2026 케이펫페어 서울',
        note: '반려견 동반 규정과 입장 방법은 공식 관람 안내에서 확인하세요.',
      },
      'mypet-ilsan-part2-2026': {
        name: '마이펫페어 2026 일산 Part 2',
        note: '공식 일정 페이지에서 행사 규모와 최신 관람 정보를 함께 확인하세요.',
      },
      'mypet-gwanggyo-2026': {
        name: '마이펫페어 2026 광교',
        note: '교통·입장·동반 규정은 방문 직전에 공식 페이지에서 다시 확인하세요.',
      },
    },
  },
  en: {
    title: 'Verified event calendar',
    subtitle: 'Only pet fairs confirmed on organizers’ official pages are listed.',
    checked: 'Source checked',
    cautionTitle: 'Recheck before booking or travel',
    caution:
      'Dates, admission, eligible animals, and carrier rules may change without notice. Confirm the official page before paying or leaving.',
    all: 'All regions',
    upcoming: 'Upcoming',
    today: 'Starts today',
    ongoing: 'In progress',
    ended: 'Ended',
    days: '{{count}} days left',
    date: 'Dates',
    venue: 'Venue',
    official: 'Check the latest official details',
    empty: 'No verified events for this region.',
    source: 'Based on official organizer pages',
    regions: { 서울: 'Seoul', 고양: 'Goyang', 수원: 'Suwon' },
    events: {
      'kpet-seoul-2026': {
        name: 'K-PET FAIR Seoul 2026',
        note: 'Check the official visitor guide for animal entry and admission requirements.',
      },
      'mypet-ilsan-part2-2026': {
        name: 'MyPetFair 2026 Ilsan Part 2',
        note: 'Review the official schedule for current visitor information and event scale.',
      },
      'mypet-gwanggyo-2026': {
        name: 'MyPetFair 2026 Gwanggyo',
        note: 'Recheck transport, admission, and animal entry rules shortly before visiting.',
      },
    },
  },
  ja: {
    title: '公式イベント日程',
    subtitle: '主催者の公式ページで確認できたペットイベントのみ掲載しています。',
    checked: '出典確認',
    cautionTitle: '予約・移動前に再確認してください',
    caution:
      '日程、入場料、同伴可能な動物、キャリー規定は予告なく変わる場合があります。支払いや出発前に公式ページをご確認ください。',
    all: '全地域',
    upcoming: '開催予定',
    today: '本日開始',
    ongoing: '開催中',
    ended: '終了',
    days: 'あと{{count}}日',
    date: '日程',
    venue: '会場',
    official: '公式ページで最新情報を確認',
    empty: '選択した地域に確認済みのイベントはありません。',
    source: '公式主催者ページ基準',
    regions: { 서울: 'ソウル', 고양: '高陽', 수원: '水原' },
    events: {
      'kpet-seoul-2026': {
        name: 'K-PET FAIR ソウル 2026',
        note: '動物同伴規定と入場方法は公式の来場案内でご確認ください。',
      },
      'mypet-ilsan-part2-2026': {
        name: 'MyPetFair 2026 一山 Part 2',
        note: '公式日程ページでイベント規模と最新の来場情報をご確認ください。',
      },
      'mypet-gwanggyo-2026': {
        name: 'MyPetFair 2026 光教',
        note: '交通、入場、動物同伴規定は来場直前に公式ページで再確認してください。',
      },
    },
  },
} as const

function Events() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage?.split('-')[0] as keyof typeof COPY
  const copy = COPY[language] ?? COPY.ko
  const locale = language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'ko-KR'
  useDocumentTitle(copy.title)

  const [region, setRegion] = useState<RegionFilter>('all')
  const regions = useMemo(
    () => Array.from(new Set(PET_EVENTS_2026.map((event) => event.region))),
    []
  )
  const events = useMemo(
    () => PET_EVENTS_2026.filter((event) => region === 'all' || event.region === region),
    [region]
  )

  const formatDate = (start: string, end: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', weekday: 'short' }
    const formatter = new Intl.DateTimeFormat(locale, options)
    const from = formatter.format(new Date(`${start}T12:00:00`))
    const to = formatter.format(new Date(`${end}T12:00:00`))
    return start === end ? from : `${from} – ${to}`
  }
  const checkedAt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date('2026-07-13T12:00:00')
  )

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{copy.source}</p>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
        <div className={styles.sourceStamp}>
          <span aria-hidden="true">✓</span>
          <span>
            {copy.checked}
            <strong>{checkedAt}</strong>
          </span>
        </div>
      </header>

      <aside className={styles.caution} aria-labelledby="event-caution-title">
        <span className={styles.cautionIcon} aria-hidden="true">
          i
        </span>
        <div>
          <h2 id="event-caution-title">{copy.cautionTitle}</h2>
          <p>{copy.caution}</p>
        </div>
      </aside>

      <div className={styles.filters} aria-label={copy.title}>
        <button
          type="button"
          className={region === 'all' ? styles.activeFilter : undefined}
          aria-pressed={region === 'all'}
          onClick={() => setRegion('all')}
        >
          {copy.all}
        </button>
        {regions.map((item) => (
          <button
            key={item}
            type="button"
            className={region === item ? styles.activeFilter : undefined}
            aria-pressed={region === item}
            onClick={() => setRegion(item)}
          >
            {copy.regions[item]}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className={styles.empty}>{copy.empty}</div>
      ) : (
        <ol className={styles.timeline}>
          {events.map((event) => {
            const localizedEvent = copy.events[event.id as keyof typeof copy.events]
            const untilStart = daysUntil(event.startDate)
            const untilEnd = daysUntil(event.endDate)
            const status =
              untilStart > 0
                ? copy.days.replace('{{count}}', String(untilStart))
                : untilStart === 0
                  ? copy.today
                  : untilEnd >= 0
                    ? copy.ongoing
                    : copy.ended
            return (
              <li key={event.id} className={styles.eventCard}>
                <div className={styles.dateBlock} aria-hidden="true">
                  <span>
                    {new Intl.DateTimeFormat(locale, { month: 'short' }).format(
                      new Date(`${event.startDate}T12:00:00`)
                    )}
                  </span>
                  <strong>{Number(event.startDate.slice(8, 10))}</strong>
                </div>
                <div className={styles.eventBody}>
                  <div className={styles.eventTopline}>
                    <span className={styles.status}>{status}</span>
                    <span className={styles.region}>{copy.regions[event.region]}</span>
                  </div>
                  <h2>{localizedEvent?.name ?? event.name}</h2>
                  <dl className={styles.details}>
                    <div>
                      <dt>{copy.date}</dt>
                      <dd>{formatDate(event.startDate, event.endDate)}</dd>
                    </div>
                    <div>
                      <dt>{copy.venue}</dt>
                      <dd>{event.venue}</dd>
                    </div>
                  </dl>
                  <p className={styles.note}>{localizedEvent?.note ?? event.note}</p>
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={styles.officialLink}
                  >
                    {copy.official}
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default Events
