import { useEffect, useRef } from 'react'

const EVENT_NAME = 'ptg:pawburst'

/**
 * 발바닥 파티클 버스트 발사 — 즐겨찾기/체크리스트 완료 등 축하 순간에 호출해요.
 * 좌표는 뷰포트 기준(px). PawBurstLayer가 마운트돼 있어야 보여요.
 */
export function firePawBurst(x: number, y: number): void {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { x, y } }))
}

/** 요소 중심 좌표에서 버스트 발사(버튼 클릭 핸들러용 헬퍼). */
export function firePawBurstFrom(element: HTMLElement | null): void {
  if (!element) return
  const rect = element.getBoundingClientRect()
  firePawBurst(rect.left + rect.width / 2, rect.top + rect.height / 2)
}

const PARTICLES = 12
const EMOJIS = ['🐾', '🐾', '💚', '✨']

/**
 * 전역 파티클 레이어 — 고정 오버레이(pointer-events 없음)에 WAAPI로 파티클을
 * 흩뿌려요. prefers-reduced-motion이면 전체 스킵.
 */
export function PawBurstLayer() {
  const layerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    const onBurst = (event: Event) => {
      const { x, y } = (event as CustomEvent<{ x: number; y: number }>).detail
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (typeof HTMLElement.prototype.animate !== 'function') return

      for (let i = 0; i < PARTICLES; i++) {
        const span = document.createElement('span')
        span.textContent = EMOJIS[i % EMOJIS.length]!
        span.setAttribute('aria-hidden', 'true')
        const size = 14 + Math.random() * 12
        span.style.cssText = `position:fixed;left:${x}px;top:${y}px;font-size:${size}px;line-height:1;pointer-events:none;will-change:transform,opacity;z-index:80;`
        layer.append(span)

        const angle = (Math.PI * 2 * i) / PARTICLES + Math.random() * 0.6
        const distance = 46 + Math.random() * 74
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance - 24 // 살짝 위로 뜨는 느낌
        const rotate = (Math.random() - 0.5) * 240

        const animation = span.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg)', opacity: 1 },
            {
              transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1) rotate(${rotate}deg)`,
              opacity: 0,
            },
          ],
          { duration: 640 + Math.random() * 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        )
        animation.onfinish = () => span.remove()
      }
    }

    window.addEventListener(EVENT_NAME, onBurst)
    return () => window.removeEventListener(EVENT_NAME, onBurst)
  }, [])

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 80 }}
    />
  )
}
