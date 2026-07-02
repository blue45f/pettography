import { Top, Button } from '@toss/tds-mobile'

import { AdBanner } from '../components/AdBanner'
import { firePawBurst } from '../components/PawBurst'
import { getSpecies, type Species } from '../lib/api'
import { getCareTasks } from '../lib/careTasks'
import { useAppStore, type ChecklistEntry } from '../lib/store'
import { haptic } from '../lib/toss'
import { navigate } from '../router'
import { theme, pageShell } from '../theme'
import { EmojiTile } from '../ui'

function ProgressBar({ ratio }: { ratio: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(ratio * 100)}
      style={{
        height: 6,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.round(ratio * 100)}%`,
          height: '100%',
          borderRadius: 999,
          background: theme.accent,
          transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />
    </div>
  )
}

function SpeciesChecklistCard({
  species,
  entry,
  delay,
}: {
  species: Species
  entry: ChecklistEntry
  delay: number
}) {
  const toggleTask = useAppStore((s) => s.toggleTask)
  const removeFromChecklist = useAppStore((s) => s.removeFromChecklist)
  const tasks = getCareTasks(species)
  const completed = tasks.filter((t) => entry.done[t.id]).length
  const allDone = completed === tasks.length

  const onToggle = (taskId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const wasDone = Boolean(entry.done[taskId])
    toggleTask(species.id, taskId)
    if (wasDone) return
    const willComplete = completed + 1 === tasks.length
    if (willComplete) {
      haptic('confetti')
      const rect = event.currentTarget.getBoundingClientRect()
      firePawBurst(rect.left + rect.width / 2, rect.top + rect.height / 2)
    } else {
      haptic('tickMedium')
    }
  }

  return (
    <section
      aria-label={`${species.koreanName} 체크리스트`}
      className="rise"
      style={{
        animationDelay: `${delay}ms`,
        borderRadius: theme.radius,
        background: theme.surface,
        border: `1px solid ${allDone ? 'rgba(95,179,122,0.45)' : theme.border}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <button
            type="button"
            onClick={() => navigate(`/species/${encodeURIComponent(species.slug)}`)}
            className="pressable"
            aria-label={`${species.koreanName} 상세 보기`}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <EmojiTile emoji={species.heroEmoji} seed={species.koreanName} size={42} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {species.koreanName}{' '}
              {allDone && (
                <span aria-hidden style={{ fontSize: 13 }}>
                  🎉
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
              {completed}/{tasks.length} 완료
            </div>
          </div>
          <button
            type="button"
            aria-label={`${species.koreanName} 체크리스트에서 제거`}
            onClick={() => removeFromChecklist(species.id)}
            className="pressable"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: theme.textMuted,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          <ProgressBar ratio={tasks.length === 0 ? 0 : completed / tasks.length} />
        </div>
      </div>

      <ul style={{ listStyle: 'none', margin: 0, padding: '2px 6px 8px' }}>
        {tasks.map((task) => {
          const done = Boolean(entry.done[task.id])
          return (
            <li key={task.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                onClick={(e) => onToggle(task.id, e)}
                className="pressable"
                style={{
                  display: 'flex',
                  gap: 11,
                  alignItems: 'flex-start',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 8px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: theme.text,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 22,
                    height: 22,
                    flexShrink: 0,
                    marginTop: 1,
                    borderRadius: 7,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    color: theme.accentInk,
                    background: done ? theme.accent : 'rgba(255,255,255,0.1)',
                    border: done ? 'none' : `1px solid rgba(255,255,255,0.18)`,
                    transition: 'background 0.18s ease',
                  }}
                >
                  {done ? '✓' : ''}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: done ? 'line-through' : 'none',
                      opacity: done ? 0.6 : 1,
                    }}
                  >
                    {task.title}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      color: theme.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {task.detail}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function ChecklistPage() {
  const checklist = useAppStore((s) => s.checklist)
  const species = getSpecies()
  const entries = Object.entries(checklist)
    .map(([speciesId, entry]) => ({
      species: species.find((s) => s.id === speciesId),
      entry,
    }))
    .filter((e): e is { species: Species; entry: ChecklistEntry } => Boolean(e.species))
    .sort((x, y) => y.entry.addedAt - x.entry.addedAt)

  const totals = entries.reduce(
    (acc, { species: s, entry }) => {
      const tasks = getCareTasks(s)
      acc.total += tasks.length
      acc.completed += tasks.filter((t) => entry.done[t.id]).length
      return acc
    },
    { completed: 0, total: 0 }
  )

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <Top
        title={<Top.TitleParagraph size={22}>☑️ 케어 체크리스트</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            {entries.length > 0
              ? `${entries.length}종 · ${totals.completed}/${totals.total} 완료`
              : '입양 준비부터 케어 루틴까지'}
          </Top.SubtitleParagraph>
        }
      />
      <div style={{ ...pageShell, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {entries.length > 0 && (
          <div className="rise">
            <ProgressBar ratio={totals.total === 0 ? 0 : totals.completed / totals.total} />
          </div>
        )}

        {entries.map(({ species: s, entry }, i) => (
          <SpeciesChecklistCard key={s.id} species={s} entry={entry} delay={60 + i * 60} />
        ))}

        {entries.length === 0 && (
          <div
            className="rise"
            style={{
              padding: '52px 24px',
              textAlign: 'center',
              borderRadius: theme.radius,
              border: `1px dashed rgba(255,255,255,0.16)`,
            }}
          >
            <div aria-hidden style={{ fontSize: 40, marginBottom: 12 }}>
              🐾
            </div>
            <p style={{ margin: '0 0 18px', color: theme.textMuted, fontSize: 14.5, lineHeight: 1.7 }}>
              아직 담은 종이 없어요.
              <br />
              도감에서 종을 담으면 케어 태스크가 자동으로 만들어져요.
            </p>
            <Button onClick={() => navigate('/species')}>도감 둘러보기</Button>
          </div>
        )}

        <AdBanner style={{ marginTop: 6 }} />
      </div>
    </div>
  )
}
