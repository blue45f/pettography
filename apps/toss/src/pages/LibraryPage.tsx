import { Top, Button } from '@toss/tds-mobile'

import { AdBanner } from '../components/AdBanner'
import { BgmControl } from '../components/BgmControl'
import { getSpecies, DIFFICULTY_LABEL, type Species } from '../lib/api'
import { useAppStore } from '../lib/store'
import { getTossAppVersionSafe, getTossEnv, haptic } from '../lib/toss'
import { navigate } from '../router'
import { theme, pageShell } from '../theme'
import { Badge, EmojiTile, SectionTitle } from '../ui'

function FavoriteRow({ species, delay }: { species: Species; delay: number }) {
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  return (
    <div
      className="rise"
      style={{
        animationDelay: `${delay}ms`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: theme.radius,
        background: theme.surface,
        border: `1px solid ${theme.border}`,
      }}
    >
      <button
        type="button"
        onClick={() => navigate(`/species/${encodeURIComponent(species.slug)}`)}
        className="pressable"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flex: 1,
          minWidth: 0,
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          color: theme.text,
          cursor: 'pointer',
        }}
      >
        <EmojiTile emoji={species.heroEmoji} seed={species.koreanName} size={48} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>
            {species.koreanName}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 12,
              color: theme.textMuted,
              fontStyle: 'italic',
              marginTop: 1,
            }}
          >
            {species.scientificName}
          </span>
          <span style={{ display: 'inline-flex', gap: 6, marginTop: 6 }}>
            <Badge accent>{DIFFICULTY_LABEL[species.difficulty] || species.difficulty}</Badge>
          </span>
        </span>
      </button>
      <button
        type="button"
        aria-label={`${species.koreanName} 즐겨찾기 해제`}
        onClick={() => {
          haptic('tickWeak')
          toggleFavorite(species.id)
        }}
        className="pressable"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          border: 'none',
          background: 'rgba(255,255,255,0.06)',
          fontSize: 18,
          cursor: 'pointer',
        }}
      >
        💚
      </button>
    </div>
  )
}

export function LibraryPage() {
  const favorites = useAppStore((s) => s.favorites)
  const hydrated = useAppStore((s) => s.hydrated)
  const species = getSpecies()
  const favoriteSpecies = species.filter((s) => favorites.includes(s.id))

  const env = getTossEnv()
  const appVersion = getTossAppVersionSafe()

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg }}>
      <Top
        title={<Top.TitleParagraph size={22}>📚 서재</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            즐겨찾는 종을 모아보고 설정을 관리해요
          </Top.SubtitleParagraph>
        }
      />
      <div style={{ ...pageShell, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <section aria-label="즐겨찾기">
          <SectionTitle>즐겨찾기 {favoriteSpecies.length > 0 && `(${favoriteSpecies.length})`}</SectionTitle>
          {favoriteSpecies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {favoriteSpecies.map((s, i) => (
                <FavoriteRow key={s.id} species={s} delay={40 + i * 50} />
              ))}
            </div>
          ) : (
            <div
              className="rise"
              style={{
                padding: '44px 24px',
                textAlign: 'center',
                borderRadius: theme.radius,
                border: `1px dashed rgba(255,255,255,0.16)`,
              }}
            >
              <div aria-hidden style={{ fontSize: 36, marginBottom: 10 }}>
                🤍
              </div>
              <p
                style={{
                  margin: '0 0 16px',
                  color: theme.textMuted,
                  fontSize: 14.5,
                  lineHeight: 1.7,
                }}
              >
                {hydrated
                  ? '종 상세에서 하트를 누르면 여기에 모여요.'
                  : '즐겨찾기를 불러오는 중이에요…'}
              </p>
              {hydrated && <Button onClick={() => navigate('/species')}>도감 둘러보기</Button>}
            </div>
          )}
        </section>

        <section aria-label="설정" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionTitle>설정</SectionTitle>
          <BgmControl />
          <div
            style={{
              padding: 16,
              borderRadius: theme.radius,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              fontSize: 12.5,
              lineHeight: 1.7,
              color: theme.textMuted,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>
              앱 정보
            </div>
            페토그래피 미니앱 · 즐겨찾기/체크리스트는 이 기기의 토스 계정 기준으로 저장돼요.
            <br />
            환경: {env === 'web' ? '웹 미리보기' : env}
            {appVersion ? ` · 토스 앱 ${appVersion}` : ''}
          </div>
        </section>

        <AdBanner />
      </div>
    </div>
  )
}
