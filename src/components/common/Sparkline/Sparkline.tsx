import styles from './Sparkline.module.css'

export interface SparklinePoint {
  x: number
  y: number
  label?: string
}

interface SparklineProps {
  points: SparklinePoint[]
  width?: number
  height?: number
  ariaLabel: string
  formatValue?: (value: number) => string
}

function Sparkline({
  points,
  width = 480,
  height = 140,
  ariaLabel,
  formatValue = (v) => v.toString(),
}: SparklineProps) {
  if (points.length === 0) return null
  const padding = 12
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  const xSpan = xMax - xMin || 1
  const ySpan = yMax - yMin || 1
  const scaleX = (x: number) => padding + ((x - xMin) / xSpan) * (width - padding * 2)
  const scaleY = (y: number) => height - padding - ((y - yMin) / ySpan) * (height - padding * 2)
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x).toFixed(2)} ${scaleY(p.y).toFixed(2)}`)
    .join(' ')
  const areaPath = `${path} L ${scaleX(xMax).toFixed(2)} ${height - padding} L ${scaleX(xMin).toFixed(2)} ${height - padding} Z`
  const latest = points[points.length - 1]

  return (
    <figure className={styles.figure} aria-label={ariaLabel}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={styles.svg}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id="sparkArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary-400)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparkArea)" />
        <path
          d={path}
          fill="none"
          stroke="var(--color-primary-600)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle
            key={`${p.x}-${p.y}`}
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r="2.5"
            fill="var(--color-primary-700)"
          />
        ))}
        <circle
          cx={scaleX(latest.x)}
          cy={scaleY(latest.y)}
          r="5"
          fill="var(--color-accent)"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <figcaption className={styles.caption}>
        <span>{formatValue(yMin)}</span>
        <span>{formatValue(yMax)}</span>
      </figcaption>
    </figure>
  )
}

export default Sparkline
