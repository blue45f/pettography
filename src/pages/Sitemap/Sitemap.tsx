import { Link } from 'react-router'

const routes = [
  '/',
  '/onboarding',
  '/dashboard',
  '/tools',
  '/hospitals',
  '/shops',
  '/care',
  '/care/:speciesId',
  '/communities',
  '/cafes',
  '/cafes/new',
  '/cafes/:cafeId',
  '/adoption',
  '/funeral',
  '/species',
  '/species/:idOrSlug',
  '/resources',
  '/diary',
  '/match',
  '/consult',
  '/forum',
  '/partners',
  '/admin',
  '/admin/moderation',
  '/admin/cafes',
  '/admin/partners',
  '/sos',
  '/health',
  '/habitat',
  '/budget',
  '/supplies',
  '/registry',
  '/compare',
  '/petid',
  '/backup',
  '/caresheet',
  '/routine',
  '/calendar',
  '/insurance',
  '/setup',
  '/morphs',
  '/genetics',
  '/molt',
  '/vivarium',
  '/showcase',
  '/qna',
  '/meetups',
  '/breeding',
  '/meds',
  '/feeding',
  '/market',
  '/passport',
  '/assistant',
  '/growth',
  '/water',
  '/brumation',
  '/gear',
  '/senior',
  '/vitals',
  '/cohab',
  '/wishlist',
  '/taming',
  '/kit',
  '/alerts',
  '/supplements',
  '/feeders',
  '/lineage',
  '/costreport',
  '/transport',
  '/cleaning',
  '/safety',
  '/seasonal',
  '/lighting',
  '/bcs',
  '/enclosure',
  '/food',
  '/events',
  '/about',
  '/terms',
  '/privacy',
  '/faq',
  '/herd',
  '/contact',
  '/support',
  '/design',
] as const

function labelFor(path: string) {
  if (path === '/') return '홈'
  if (path === '/design') return '디자인 시스템'
  return path.replace(/^\//, '').replaceAll('/', ' / ').replaceAll(':', '').replaceAll('-', ' ')
}

export default function Sitemap() {
  return (
    <main
      style={{
        maxWidth: 'var(--layout-max)',
        margin: '0 auto',
        padding: 'var(--spacing-2xl) var(--layout-pad)',
      }}
    >
      <section
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface)',
          padding: 'var(--spacing-xl)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <p
          style={{
            color: 'var(--color-primary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          BETA Sitemap
        </p>
        <h1 style={{ margin: 'var(--spacing-xs) 0', color: 'var(--color-text)' }}>
          Pettography 사이트맵
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '64ch' }}>
          반려동물 관리, 커뮤니티, 운영, 정책, 디자인 시스템까지 모든 경로를 한 화면에 정리했습니다.
        </p>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))',
          gap: 'var(--spacing-sm)',
        }}
      >
        {routes.map((path) => (
          <Link
            key={path}
            to={path}
            style={{
              display: 'grid',
              gap: 'var(--spacing-xs)',
              minHeight: '7rem',
              padding: 'var(--spacing-md)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-surface)',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <strong style={{ color: 'var(--color-text)' }}>{labelFor(path)}</strong>
            <code style={{ color: 'var(--color-text-secondary)', overflowWrap: 'anywhere' }}>
              {path}
            </code>
          </Link>
        ))}
      </div>
    </main>
  )
}
