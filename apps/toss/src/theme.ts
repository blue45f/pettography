export const theme = {
  bg: '#0c140e',
  surface: '#16211a',
  surfaceAlt: '#1e2c23',
  border: 'rgba(255,255,255,0.08)',
  text: '#e8f3ea',
  textMuted: '#9bb6a4',
  accent: '#5fb37a',
  accentSoft: 'rgba(95,179,122,0.18)',
  accentInk: '#04130a',
  danger: '#ff6b6b',
  radius: 16,
} as const
export const pageShell: React.CSSProperties = {
  maxWidth: 520,
  margin: '0 auto',
  // 하단 여백은 플로팅 탭바(≈76px)+세이프에어리어를 피할 만큼 확보해요.
  padding: '4px 16px calc(118px + env(safe-area-inset-bottom))',
}
