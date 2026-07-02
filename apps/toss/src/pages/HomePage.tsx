import { Top } from '@toss/tds-mobile'
import { useRef } from 'react'

import { AdBanner } from '../components/AdBanner'
import { firePawBurstFrom } from '../components/PawBurst'
import { getSpecies, CATEGORY_LABEL, DIFFICULTY_LABEL, type Species } from '../lib/api'
import { useRewardedAd } from '../lib/ads'
import { getCareTasks } from '../lib/careTasks'
import { pickDaily, todayKey } from '../lib/daily'
import { useAppStore } from '../lib/store'
import { haptic } from '../lib/toss'
import { navigate } from '../router'
import { theme, pageShell } from '../theme'
import { Badge, EmojiTile, SectionTitle } from '../ui'

const CATEGORY_EMOJI: Record<string, string> = {
  reptile: '🦎',
  amphibian: '🐸',
  arthropod: '🕷️',
  invertebrate: '🐌',
  fish: '🐠',
  mammal: '🐹',
  smallMammal: '🐹',
  bird: '🦜',
}

function TodayTipCard({ species }: { species: Species }) {
  return (
    <button
      type="button"
      onClick={() => navigate(`/species/${encodeURIComponent(species.slug)}`)}
      className="pressable"
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 18,
        borderRadius: theme.radius,
        border: `1px solid rgba(95,179,122,0.35)`,
        background: `linear-gradient(140deg, rgba(95,179,122,0.2), rgba(95,179,122,0.06))`,
        color: theme.text,
        cursor: 'pointer',
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.accent, marginBottom: 8 }}>
        💡 오늘의 케어 팁
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <EmojiTile emoji={species.heroEmoji} seed={species.koreanName} size={46} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{species.koreanName}</div>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 13.5,
              lineHeight: 1.6,
              color: theme.text,
            }}
          >
            {species.beginnerTip}
          </p>
        </div>
      </div>
    </button>
  )
}

/** 보상형 광고 옵트인 — 오늘의 케어 리포트. env 미설정/미지원이면 렌더 안 함. */
function CareReportCard() {
  const species = getSpecies()
  const favorites = useAppStore((s) => s.favorites)
  const reportUnlockedDate = useAppStore((s) => s.reportUnlockedDate)
  const unlockReport = useAppStore((s) => s.unlockReport)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const rewarded = useRewardedAd({
    onReward: () => {
      unlockReport(todayKey())
      haptic('confetti')
      firePawBurstFrom(cardRef.current)
    },
  })

  if (!rewarded.configured) return null

  const unlocked = reportUnlockedDate === todayKey()
  const pool = favorites.length > 0 ? species.filter((s) => favorites.includes(s.id)) : species
  const picks = [0, 1, 2]
    .map((salt) => pickDaily(pool, salt * 5))
    .filter((s): s is Species => Boolean(s))
  const unique = [...new Map(picks.map((s) => [s.id, s])).values()]

  return (
    <div
      ref={cardRef}
      style={{
        padding: 18,
        borderRadius: theme.radius,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.accent }}>
        📋 오늘의 케어 리포트
      </div>
      {unlocked ? (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {unique.map((s, i) => {
            const task = pickDaily(getCareTasks(s), i * 3)
            return (
              <div key={s.id} style={{ display: 'flex', gap: 10 }}>
                <span aria-hidden style={{ fontSize: 20 }}>
                  {s.heroEmoji}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                    {s.koreanName} · {task?.title}
                  </div>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: theme.textMuted,
                    }}
                  >
                    {task?.detail}
                  </p>
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 11.5, color: theme.textMuted }}>내일 새 리포트가 열려요.</div>
        </div>
      ) : (
        <>
          <p style={{ margin: '8px 0 12px', fontSize: 13.5, lineHeight: 1.6, color: theme.textMuted }}>
            짧은 광고를 보면 {favorites.length > 0 ? '즐겨찾기 종' : '오늘의 종'} 맞춤 케어
            포인트 3가지를 받아요.
          </p>
          <button
            type="button"
            disabled={!rewarded.ready || rewarded.showing}
            onClick={() => rewarded.show()}
            className="pressable"
            style={{
              width: '100%',
              minHeight: 46,
              borderRadius: 12,
              border: 'none',
              background: rewarded.ready ? theme.accent : 'rgba(255,255,255,0.12)',
              color: rewarded.ready ? theme.accentInk : theme.textMuted,
              fontSize: 14.5,
              fontWeight: 700,
              cursor: rewarded.ready ? 'pointer' : 'default',
            }}
          >
            {rewarded.ready ? '광고 보고 리포트 받기' : '광고 준비 중…'}
          </button>
        </>
      )}
    </div>
  )
}

export function HomePage() {
  const species = getSpecies()
  const favorites = useAppStore((s) => s.favorites)
  const tipSpecies = pickDaily(species)

  const featured = [...species]
    .sort((a, b) => (a.difficulty === 'beginner' ? -1 : 1) - (b.difficulty === 'beginner' ? -1 : 1))
    .slice(0, 8)

  const categories = [...new Map(species.map((s) => [s.category, s])).keys()].map((cat) => ({
    cat,
    label: CATEGORY_LABEL[cat] || cat,
    emoji: CATEGORY_EMOJI[cat] || '🐾',
    count: species.filter((s) => s.category === cat).length,
  }))

  const favoriteSpecies = species.filter((s) => favorites.includes(s.id))

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <Top
        title={<Top.TitleParagraph size={22}>🐾 페토그래피</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            오늘도 좋은 케어 — 희귀 반려동물 도감
          </Top.SubtitleParagraph>
        }
      />
      <div style={{ ...pageShell, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {tipSpecies && (
          <div className="rise">
            <TodayTipCard species={tipSpecies} />
          </div>
        )}

        <section className="rise" style={{ animationDelay: '60ms' }} aria-label="추천 종">
          <SectionTitle>추천 종</SectionTitle>
          <div className="hscroll" style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
            {featured.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => navigate(`/species/${encodeURIComponent(s.slug)}`)}
                className="pressable"
                style={{
                  flexShrink: 0,
                  width: 128,
                  scrollSnapAlign: 'start',
                  padding: 12,
                  borderRadius: theme.radius,
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <EmojiTile emoji={s.heroEmoji} seed={s.koreanName} size={44} />
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    marginTop: 8,
                    lineHeight: 1.35,
                    minHeight: 36,
                  }}
                >
                  {s.koreanName}
                </div>
                <Badge accent>{DIFFICULTY_LABEL[s.difficulty] || s.difficulty}</Badge>
              </button>
            ))}
          </div>
        </section>

        <section className="rise" style={{ animationDelay: '110ms' }} aria-label="카테고리">
          <SectionTitle>카테고리</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {categories.map((c) => (
              <button
                key={c.cat}
                type="button"
                onClick={() => navigate(`/species?cat=${encodeURIComponent(c.label)}`)}
                className="pressable"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '13px 14px',
                  borderRadius: theme.radius,
                  background: theme.surfaceAlt,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span aria-hidden style={{ fontSize: 22 }}>
                  {c.emoji}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>{c.label}</span>
                  <span style={{ display: 'block', fontSize: 12, color: theme.textMuted }}>
                    {c.count}종
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rise" style={{ animationDelay: '150ms' }} aria-label="종 비교">
          <button
            type="button"
            onClick={() => navigate('/compare')}
            className="pressable"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '15px 16px',
              borderRadius: theme.radius,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span aria-hidden style={{ fontSize: 20 }}>
                ⚖️
              </span>
              <span style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700 }}>종 비교</span>
                <span style={{ display: 'block', fontSize: 12.5, color: theme.textMuted }}>
                  두 종의 난이도·예산·수명을 나란히
                </span>
              </span>
            </span>
            <span aria-hidden style={{ color: theme.textMuted, fontSize: 18 }}>
              ›
            </span>
          </button>
        </section>

        <div className="rise" style={{ animationDelay: '190ms' }}>
          <CareReportCard />
        </div>

        {favoriteSpecies.length > 0 && (
          <section className="rise" style={{ animationDelay: '230ms' }} aria-label="즐겨찾기">
            <SectionTitle
              action={{ label: '서재 열기', onClick: () => navigate('/library') }}
            >
              즐겨찾기
            </SectionTitle>
            <div className="hscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {favoriteSpecies.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(`/species/${encodeURIComponent(s.slug)}`)}
                  className="pressable"
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    height: 38,
                    padding: '0 13px',
                    borderRadius: 999,
                    background: theme.surfaceAlt,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span aria-hidden>{s.heroEmoji}</span>
                  {s.koreanName}
                </button>
              ))}
            </div>
          </section>
        )}

        <AdBanner />
      </div>
    </div>
  )
}
