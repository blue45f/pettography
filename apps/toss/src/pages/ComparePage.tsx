import { useState } from 'react'

import {
  getSpecies,
  getSpeciesBySlug,
  CATEGORY_LABEL,
  DIFFICULTY_LABEL,
  SPACE_LABEL,
  ACTIVITY_LABEL,
  HANDLING_LABEL,
  won,
  type Species,
} from '../lib/api'
import { navigate } from '../router'
import { theme } from '../theme'
import { EmojiTile } from '../ui'

function SpeciesPicker({
  label,
  value,
  exclude,
  onChange,
}: {
  label: string
  value: string
  exclude?: string
  onChange: (slug: string) => void
}) {
  const options = getSpecies().filter((s) => s.slug !== exclude)
  return (
    <label style={{ flex: 1, minWidth: 0, display: 'block' }}>
      <span
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 700,
          color: theme.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: 46,
          padding: '0 12px',
          borderRadius: 12,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          color: value ? theme.text : theme.textMuted,
          fontSize: 14.5,
          fontWeight: 600,
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        <option value="">종 선택…</option>
        {options.map((s) => (
          <option key={s.id} value={s.slug}>
            {s.heroEmoji} {s.koreanName}
          </option>
        ))}
      </select>
    </label>
  )
}

interface CompareRow {
  label: string
  value: (s: Species) => string
}

const ROWS: CompareRow[] = [
  { label: '카테고리', value: (s) => CATEGORY_LABEL[s.category] || s.category },
  { label: '난이도', value: (s) => DIFFICULTY_LABEL[s.difficulty] || s.difficulty },
  { label: '수명', value: (s) => `${s.lifespanMinYears}~${s.lifespanMaxYears}년` },
  { label: '월 예산', value: (s) => won(s.monthlyBudgetKrw) },
  { label: '필요 공간', value: (s) => SPACE_LABEL[s.spaceNeed] || s.spaceNeed },
  { label: '핸들링 허용도', value: (s) => HANDLING_LABEL[s.handlingTolerance] || s.handlingTolerance },
  { label: '활동 패턴', value: (s) => ACTIVITY_LABEL[s.activityPattern] || s.activityPattern },
]

function CompareColumnHead({ species }: { species: Species | undefined }) {
  if (!species) {
    return (
      <div style={{ flex: 1, textAlign: 'center', color: theme.textMuted, fontSize: 13 }}>
        종을 선택하세요
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => navigate(`/species/${encodeURIComponent(species.slug)}`)}
      className="pressable"
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        color: theme.text,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <EmojiTile emoji={species.heroEmoji} seed={species.koreanName} size={52} />
      <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.3, textAlign: 'center' }}>
        {species.koreanName}
      </span>
    </button>
  )
}

export function ComparePage({ initialA, initialB }: { initialA?: string; initialB?: string }) {
  const [slugA, setSlugA] = useState(initialA ?? '')
  const [slugB, setSlugB] = useState(initialB ?? '')
  const a = getSpeciesBySlug(slugA)
  const b = getSpeciesBySlug(slugB)
  const bothPicked = Boolean(a && b)

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
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
          onClick={() => navigate('/')}
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
        <h1 style={{ fontSize: 17, fontWeight: 800 }}>⚖️ 종 비교</h1>
      </header>

      <div className="rise" style={{ maxWidth: 520, margin: '0 auto', padding: '8px 16px 60px' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <SpeciesPicker label="종 A" value={slugA} exclude={slugB} onChange={setSlugA} />
          <SpeciesPicker label="종 B" value={slugB} exclude={slugA} onChange={setSlugB} />
        </div>

        {bothPicked ? (
          <div
            style={{
              borderRadius: theme.radius,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '18px 14px 14px',
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <CompareColumnHead species={a} />
              <div
                aria-hidden
                style={{
                  alignSelf: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: theme.accent,
                  flexShrink: 0,
                }}
              >
                VS
              </div>
              <CompareColumnHead species={b} />
            </div>
            <dl style={{ margin: 0 }}>
              {ROWS.map((row, i) => {
                const va = a ? row.value(a) : '—'
                const vb = b ? row.value(b) : '—'
                const differs = va !== vb
                return (
                  <div
                    key={row.label}
                    className="rise"
                    style={{
                      animationDelay: `${i * 40}ms`,
                      padding: '11px 14px',
                      borderBottom: i < ROWS.length - 1 ? `1px solid ${theme.border}` : 'none',
                    }}
                  >
                    <dt
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: theme.textMuted,
                        textAlign: 'center',
                        marginBottom: 5,
                      }}
                    >
                      {row.label}
                    </dt>
                    <dd style={{ margin: 0, display: 'flex', gap: 8 }}>
                      <span
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          fontSize: 14,
                          fontWeight: differs ? 800 : 600,
                          color: differs ? theme.accent : theme.text,
                        }}
                      >
                        {va}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          textAlign: 'center',
                          fontSize: 14,
                          fontWeight: differs ? 800 : 600,
                          color: differs ? theme.accent : theme.text,
                        }}
                      >
                        {vb}
                      </span>
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
        ) : (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              borderRadius: theme.radius,
              border: `1px dashed rgba(255,255,255,0.16)`,
              color: theme.textMuted,
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            비교할 두 종을 선택하면
            <br />
            난이도·수명·예산을 나란히 볼 수 있어요.
          </div>
        )}
      </div>
    </div>
  )
}
