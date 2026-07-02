import { Top } from '@toss/tds-mobile'
import { useMemo, useState } from 'react'

import { AdBanner } from '../components/AdBanner'
import { getSpecies, CATEGORY_LABEL, DIFFICULTY_LABEL, won, type Species } from '../lib/api'
import { navigate } from '../router'
import { theme, pageShell } from '../theme'
import { SearchBar, Chips, Badge, EmojiTile } from '../ui'

const ALL = '전체'

export function SpeciesListPage({ initialCategory }: { initialCategory?: string }) {
  const items = getSpecies()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState(initialCategory || ALL)

  const cats = useMemo(() => {
    const c = new Map<string, number>()
    for (const s of items)
      c.set(
        CATEGORY_LABEL[s.category] || s.category,
        (c.get(CATEGORY_LABEL[s.category] || s.category) || 0) + 1
      )
    return [
      ALL,
      ...[...c.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)
        .slice(0, 7),
    ]
  }, [items])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((s) => {
      const okC = cat === ALL || (CATEGORY_LABEL[s.category] || s.category) === cat
      const okQ =
        !query ||
        [s.koreanName, s.scientificName, s.summary, ...(s.tags || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      return okC && okQ
    })
  }, [items, q, cat])

  const open = (s: Species) => navigate(`/species/${encodeURIComponent(s.slug)}`)

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <Top
        title={<Top.TitleParagraph size={22}>🦎 종 도감</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>희귀 반려동물 종 정보·케어 가이드</Top.SubtitleParagraph>
        }
      />
      <div style={pageShell}>
        <div className="rise" style={{ marginBottom: 12 }}>
          <SearchBar value={q} onChange={setQ} placeholder="종·학명·특성 검색" />
        </div>
        <div className="rise" style={{ animationDelay: '60ms', marginBottom: 18 }}>
          <Chips items={cats} active={cat} onPick={setCat} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => open(s)}
              className="pressable rise"
              style={{
                animationDelay: `${90 + i * 22}ms`,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius,
                padding: 12,
                color: theme.text,
                cursor: 'pointer',
              }}
            >
              <EmojiTile emoji={s.heroEmoji} seed={s.koreanName} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{s.koreanName}</div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: theme.textMuted,
                    marginTop: 1,
                    fontStyle: 'italic',
                  }}
                >
                  {s.scientificName}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <Badge accent>{DIFFICULTY_LABEL[s.difficulty] || s.difficulty}</Badge>
                  <Badge>
                    수명 {s.lifespanMinYears}~{s.lifespanMaxYears}년
                  </Badge>
                  <Badge>월 {won(s.monthlyBudgetKrw)}</Badge>
                </div>
              </div>
              <span aria-hidden style={{ color: theme.textMuted, fontSize: 20, opacity: 0.5 }}>
                ›
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p style={{ textAlign: 'center', color: theme.textMuted, padding: '40px 0' }}>
              ‘{q || cat}’ 결과가 없어요.
            </p>
          )}
        </div>

        <AdBanner style={{ marginTop: 20 }} />
      </div>
    </div>
  )
}
