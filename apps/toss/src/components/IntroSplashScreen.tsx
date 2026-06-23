import { useEffect, useRef, useState } from 'react'

interface HeartParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
  growth: number
}

export default function IntroSplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 2000)
    const destroyTimer = setTimeout(() => setIsVisible(false), 2700)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(destroyTimer)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const particles: HeartParticle[] = []
    const colors = [
      'rgba(244, 143, 177, ', // Pastel Pink
      'rgba(255, 204, 188, ', // Peach Cream
      'rgba(255, 235, 156, ', // Pastel Yellow
    ]

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * width,
        y: height + Math.random() * 100, // Starts below the screen
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(Math.random() * 1.2 + 0.6),
        size: Math.random() * 8 + 4,
        alpha: Math.random() * 0.5 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
        growth: Math.random() * 0.05 + 0.02,
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Helper to draw a heart shape
    const drawHeart = (x: number, y: number, size: number, color: string) => {
      ctx.save()
      ctx.beginPath()
      ctx.translate(x, y)
      ctx.moveTo(0, 0)
      
      // Left curve
      ctx.bezierCurveTo(-size / 2, -size / 2, -size, size / 3, 0, size)
      // Right curve
      ctx.bezierCurveTo(size, size / 3, size / 2, -size / 2, 0, 0)

      ctx.fillStyle = color
      ctx.fill()
      ctx.restore()
    };

    let frame = 0
    const render = () => {
      frame++
      ctx.fillStyle = '#1e1b18' // Warm Pet Cocoa-dark background
      ctx.fillRect(0, 0, width, height)

      // Draw and update hearts
      particles.forEach((p) => {
        if (!p) return
        p.x += p.vx
        p.y += p.vy
        p.size += p.growth

        if (p.y < -50) {
          p.y = height + 50
          p.x = Math.random() * width
        }

        drawHeart(p.x, p.y, p.size, p.color + p.alpha + ')')
      })

      // Main Text
      const text = 'PETTOGRAPHY'
      ctx.font = '900 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.letterSpacing = '6px'
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 10
      ctx.shadowColor = 'rgba(244, 143, 177, 0.5)'

      const progress = Math.min(frame / 40, 1)
      const currentText = text.substring(0, Math.floor(text.length * progress))
      ctx.fillText(currentText, width / 2, height / 2)
      ctx.shadowBlur = 0

      // Sub
      ctx.font = '500 10px monospace'
      ctx.letterSpacing = '2px'
      ctx.fillStyle = 'rgba(244, 143, 177, 0.8)'
      ctx.fillText('PET SNAPSHOT JOURNAL', width / 2, height / 2 + 32)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e1b18',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: isFading ? 'none' : 'auto',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
