import { Button } from '@toss/tds-mobile'
import { useEffect, useState } from 'react'

import { AdBanner } from '../components/AdBanner'
import { firePawBurst } from '../components/PawBurst'
import {
  getSpeciesBySlug,
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
  SPACE_LABEL,
  ACTIVITY_LABEL,
  won,
} from '../lib/api'
import { useAppStore } from '../lib/store'
import { getTossShareLinkSafe, haptic, shareMessage, WEB_ORIGIN } from '../lib/toss'
import { navigate } from '../router'
import { theme } from '../theme'
import { Badge, StatStrip } from '../ui'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        borderRadius: theme.radius,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent, marginBottom: 7 }}>
        {title}
      </div>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: theme.text }}>{children}</p>
    </div>
  )
}

export function SpeciesDetailPage({ slug = '' }: { slug?: string }) {
  const s = getSpeciesBySlug(slug)
  const [toast, setToast] = useState<string | null>(null)
  const favorites = useAppStore((st) => st.favorites)
  const checklist = useAppStore((st) => st.checklist)
  const toggleFavorite = useAppStore((st) => st.toggleFavorite)
  const addToChecklist = useAppStore((st) => st.addToChecklist)

  useEffect(() => {
    if (!toast) return
    const x = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(x)
  }, [toast])

  const isFavorite = s ? favorites.includes(s.id) : false
  const inChecklist = s ? Boolean(checklist[s.id]) : false

  const onToggleFavorite = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!s) return
    if (!isFavorite) {
      haptic('success')
      const rect = event.currentTarget.getBoundingClientRect()
      firePawBurst(rect.left + rect.width / 2, rect.top + rect.height / 2)
      setToast('서재에 담았어요.')
    } else {
      haptic('tickWeak')
    }
    toggleFavorite(s.id)
  }

  const Header = (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        padding: '0 8px',
        paddingTop: 'env(safe-area-inset-top)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: `color-mix(in oklab, ${theme.bg} 84%, transparent)`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigate('/species')}
        className="pressable"
        style={{
          width: 44,
          height: 44,
          background: 'none',
          border: 'none',
          color: theme.text,
          fontSize: 24,
          cursor: 'pointer',
        }}
      >
        ←
      </button>
      {s && (
        <button
          type="button"
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
          className="pressable"
          style={{
            width: 44,
            height: 44,
            background: 'none',
            border: 'none',
            fontSize: 22,
            cursor: 'pointer',
            color: isFavorite ? theme.accent : theme.textMuted,
          }}
        >
          {isFavorite ? '💚' : '🤍'}
        </button>
      )}
    </header>
  )
  if (!s)
    return (
      <div style={{ background: theme.bg, minHeight: '100dvh' }}>
        {Header}
        <p style={{ textAlign: 'center', color: theme.textMuted, paddingTop: 40 }}>
          종을 찾을 수 없어요.
        </p>
      </div>
    )

  const hue = s.koreanName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360

  const share = async () => {
    const deepLink = `intoss://pettography/species/${encodeURIComponent(s.slug)}`
    const tossLink = await getTossShareLinkSafe(deepLink, `${WEB_ORIGIN}/og-toss.png`)
    const fallbackLink = `${WEB_ORIGIN}/species/${encodeURIComponent(s.slug)}`
    const message = `[페토그래피] ${s.koreanName} (${s.scientificName})\n${s.summary}\n${tossLink ?? fallbackLink}`
    const r = await shareMessage(message)
    if (r === 'clipboard') setToast('링크를 클립보드에 복사했어요.')
  }

  const onChecklistCta = () => {
    if (inChecklist) {
      navigate('/checklist')
      return
    }
    haptic('success')
    addToChecklist(s.id)
    setToast('케어 체크리스트에 담았어요.')
  }

  const stats = [
    { label: '난이도', value: DIFFICULTY_LABEL[s.difficulty] || s.difficulty },
    { label: '수명', value: `${s.lifespanMinYears}~${s.lifespanMaxYears}년` },
    { label: '월 예산', value: won(s.monthlyBudgetKrw) },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      {Header}
      <div className="rise" style={{ padding: '4px 20px 130px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              display: 'grid',
              placeItems: 'center',
              fontSize: 40,
              flexShrink: 0,
              background: `linear-gradient(140deg, oklch(0.42 0.1 ${hue}), oklch(0.28 0.07 ${hue}))`,
            }}
          >
            {s.heroEmoji}
          </div>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
              <Badge accent>{CATEGORY_LABEL[s.category] || s.category}</Badge>
              <Badge>{ACTIVITY_LABEL[s.activityPattern] || s.activityPattern}</Badge>
              <Badge>{SPACE_LABEL[s.spaceNeed] || s.spaceNeed}공간</Badge>
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.25 }}>{s.koreanName}</h1>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: 13,
                color: theme.textMuted,
                fontStyle: 'italic',
              }}
            >
              {s.scientificName}
            </p>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <StatStrip stats={stats} />
        </div>

        {s.summary && (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.78,
              color: theme.text,
              margin: '20px 0 0',
              maxWidth: '72ch',
            }}
          >
            {s.summary}
          </p>
        )}

        <Section title="🌡️ 사육 환경">{s.environment}</Section>
        <Section title="🍽️ 먹이">{s.diet}</Section>
        <Section title="💡 입문 팁">{s.beginnerTip}</Section>
        <Section title="⚠️ 흔한 문제">{s.commonProblem}</Section>

        {s.tags?.length ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
            {s.tags.map((t) => (
              <Badge key={t}>#{t}</Badge>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            type="button"
            onClick={() => navigate(`/compare?a=${encodeURIComponent(s.slug)}`)}
            className="pressable"
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: 14,
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              fontSize: 15.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚖️ 비교하기
          </button>
          <button
            type="button"
            onClick={share}
            className="pressable"
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: 14,
              border: `1px solid ${theme.border}`,
              background: 'transparent',
              color: theme.text,
              fontSize: 15.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            공유하기
          </button>
        </div>

        <AdBanner style={{ marginTop: 22 }} />
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
          background: `linear-gradient(to top, ${theme.bg} 72%, transparent)`,
          zIndex: 20,
        }}
      >
        <Button style={{ width: '100%' }} onClick={onChecklistCta}>
          {inChecklist ? '체크리스트 보기' : '케어 체크리스트 담기'}
        </Button>
      </div>
      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 'calc(84px + env(safe-area-inset-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.86)',
            color: theme.text,
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 13.5,
            maxWidth: '90%',
            textAlign: 'center',
            zIndex: 30,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
