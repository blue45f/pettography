import useDocumentTitle from '@hooks/useDocumentTitle'
import useReducedMotion from '@hooks/useReducedMotion'
import useTheme from '@hooks/useTheme'
import { Inbox, Moon, Sun } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

import { Accordion } from '@/components/ui/Accordion'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Progress } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Tabs } from '@/components/ui/Tabs'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/utils/cn'

/* -------------------------------------------------------------------------- */
/*  Live token reader                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Reads the *resolved* values of CSS custom properties off `:root`, re-reading
 * whenever `signature` changes (theme / category switch). The read is deferred
 * to the next frame so it runs after the browser has applied the new cascade,
 * and the setState lands in a rAF callback (an external event), not
 * synchronously inside the effect body.
 *
 * `names` is a stable literal at each call site; `signature` serializes the
 * reactive inputs that should trigger a re-read.
 */
function useResolvedTokens(names: readonly string[], signature: string): Record<string, string> {
  const [resolved, setResolved] = useState<Record<string, string>>({})

  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement)
      const next: Record<string, string> = {}
      for (const name of names) {
        next[name] = style.getPropertyValue(name).trim()
      }
      setResolved(next)
    }
    const frame = requestAnimationFrame(read)
    return () => cancelAnimationFrame(frame)
  }, [names, signature])

  return resolved
}

/* -------------------------------------------------------------------------- */
/*  Section scaffolding                                                        */
/* -------------------------------------------------------------------------- */

const NAV_SECTIONS = [
  { id: 'color', label: 'Color' },
  { id: 'type', label: 'Typography' },
  { id: 'spacing', label: 'Spacing' },
  { id: 'radii', label: 'Radii' },
  { id: 'elevation', label: 'Elevation' },
  { id: 'motion', label: 'Motion' },
  { id: 'components', label: 'Components' },
] as const

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 flex flex-col gap-5 border-t border-line pt-10"
    >
      <div className="flex flex-col gap-1.5">
        <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight text-ink">
          {title}
        </h2>
        {description ? (
          <p className="max-w-[68ch] text-base leading-normal text-ink-secondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** Small caption that labels a component state. */
function StateCaption({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{children}</span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Color section                                                             */
/* -------------------------------------------------------------------------- */

const PRIMARY_RAMP = [50, 100, 200, 300, 400, 500, 600, 700, 800] as const
const CORAL_RAMP = [50, 100, 300, 500, 600] as const

const SEMANTIC_TOKENS = [
  { name: '--color-success', label: 'Success' },
  { name: '--color-warning', label: 'Warning' },
  { name: '--color-error', label: 'Danger' },
  { name: '--color-info', label: 'Info' },
] as const

const NEUTRAL_TOKENS = [
  { name: '--color-text', label: 'Ink' },
  { name: '--color-text-secondary', label: 'Ink secondary' },
  { name: '--color-text-muted', label: 'Ink muted' },
  { name: '--color-background', label: 'App background' },
  { name: '--color-surface', label: 'Surface' },
  { name: '--color-surface-muted', label: 'Surface muted' },
  { name: '--color-border', label: 'Line' },
  { name: '--color-border-strong', label: 'Line strong' },
] as const

const CATEGORY_OPTIONS = [
  { value: '', label: 'Default (Indigo)' },
  { value: 'reptile', label: 'Reptile (Green)' },
  { value: 'amphibian', label: 'Amphibian (Teal)' },
  { value: 'arthropod', label: 'Arthropod (Amber)' },
  { value: 'mammal', label: 'Mammal (Rose)' },
] as const

function Swatch({ token, value }: { token: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-16 w-full rounded-md border border-line shadow-xs"
        style={{ backgroundColor: `var(${token})` }}
      >
        <span className="sr-only">{value || token}</span>
      </div>
      <div className="flex flex-col">
        <code className="text-xs font-medium text-ink">{token}</code>
        <code className="text-xs tabular-nums text-ink-muted">{value || '…'}</code>
      </div>
    </div>
  )
}

function ColorSection() {
  const { isDark } = useTheme()
  const [category, setCategory] = useState('')

  // Preview the category remap on this page only — restore on unmount so the
  // global app theme (driven by the onboarding profile) is never clobbered.
  const previousCategory = useRef<string | null>(null)
  useEffect(() => {
    const root = document.documentElement
    if (previousCategory.current === null) {
      previousCategory.current = root.getAttribute('data-category')
    }
    if (category) {
      root.setAttribute('data-category', category)
    } else if (previousCategory.current) {
      root.setAttribute('data-category', previousCategory.current)
    } else {
      root.removeAttribute('data-category')
    }
    return () => {
      const original = previousCategory.current
      if (original) root.setAttribute('data-category', original)
      else root.removeAttribute('data-category')
    }
  }, [category])

  const primaryNames = useMemo(() => PRIMARY_RAMP.map((n) => `--color-primary-${n}`), [])
  const coralNames = useMemo(() => CORAL_RAMP.map((n) => `--color-accent-${n}`), [])
  const semanticNames = useMemo(() => SEMANTIC_TOKENS.map((t) => t.name), [])
  const neutralNames = useMemo(() => NEUTRAL_TOKENS.map((t) => t.name), [])

  const signature = `${isDark ? 'dark' : 'light'}:${category}`
  const primary = useResolvedTokens(primaryNames, signature)
  const coral = useResolvedTokens(coralNames, signature)
  const semantic = useResolvedTokens(semanticNames, signature)
  const neutral = useResolvedTokens(neutralNames, signature)

  const selectId = useId()

  return (
    <Section
      id="color"
      title="Color"
      description="Brand primary is remapped at runtime per [data-category] — every swatch resolves through getComputedStyle, so the values below update live as you preview a category or flip the theme."
    >
      {/* Category preview control */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-line bg-panel-muted p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={selectId}>Preview category remap</Label>
          <select
            id={selectId}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(
              'h-10 rounded-md border border-line bg-panel px-3 text-base text-ink shadow-sm',
              'transition-colors duration-150 ease-quint',
              'focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand'
            )}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value || 'default'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="max-w-[42ch] text-sm leading-normal text-ink-secondary">
          Preview only — this restores the app&apos;s category on leave. In the real app the
          category comes from the user&apos;s onboarding profile.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-ink">Primary ramp</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
          {PRIMARY_RAMP.map((n) => {
            const token = `--color-primary-${n}`
            return <Swatch key={token} token={token} value={primary[token] ?? ''} />
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-ink">Coral accent</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
          {CORAL_RAMP.map((n) => {
            const token = `--color-accent-${n}`
            return <Swatch key={token} token={token} value={coral[token] ?? ''} />
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-ink">Semantic states</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
            {SEMANTIC_TOKENS.map((t) => (
              <Swatch key={t.name} token={t.name} value={semantic[t.name] ?? ''} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-ink">Neutrals &amp; surfaces</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
            {NEUTRAL_TOKENS.map((t) => (
              <Swatch key={t.name} token={t.name} value={neutral[t.name] ?? ''} />
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Typography section                                                        */
/* -------------------------------------------------------------------------- */

const TYPE_SCALE = [
  { token: '--font-size-5xl', label: '5xl', sample: 'Display' },
  { token: '--font-size-4xl', label: '4xl', sample: 'Heading' },
  { token: '--font-size-3xl', label: '3xl / h1', sample: 'Section title' },
  { token: '--font-size-2xl', label: '2xl / h2', sample: 'Subsection' },
  { token: '--font-size-xl', label: 'xl / h3', sample: 'Card title' },
  { token: '--font-size-lg', label: 'lg', sample: 'Lead paragraph' },
  { token: '--font-size-base', label: 'base', sample: 'Body text' },
  { token: '--font-size-sm', label: 'sm', sample: 'Secondary / caption' },
  { token: '--font-size-xs', label: 'xs', sample: 'Eyebrow / meta' },
] as const

function TypographySection() {
  return (
    <Section
      id="type"
      title="Typography"
      description="Pretendard Variable carries everything — display and body share one family, kept distinct by weight and a fluid clamp() scale that interpolates between 320 and 1280px viewports."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <Card.Body className="flex flex-col gap-1">
            <StateCaption>--font-family (body)</StateCaption>
            <p
              className="text-2xl font-medium text-ink"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              다람쥐 헌 쳇바퀴
            </p>
            <p className="text-base text-ink" style={{ fontFamily: 'var(--font-family)' }}>
              The quick brown fox 1234567890
            </p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body className="flex flex-col gap-1">
            <StateCaption>--font-display (headings)</StateCaption>
            <p
              className="text-2xl font-bold tracking-tight text-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              희귀 반려동물 포털
            </p>
            <p
              className="text-base font-bold text-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              The quick brown fox 1234567890
            </p>
          </Card.Body>
        </Card>
      </div>

      <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-panel">
        {TYPE_SCALE.map((step) => (
          <div
            key={step.token}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3"
          >
            <span
              className="min-w-0 truncate font-semibold text-ink"
              style={{ fontSize: `var(${step.token})`, lineHeight: 'var(--leading-tight)' }}
            >
              {step.sample}
            </span>
            <code className="shrink-0 text-xs text-ink-muted">{step.token}</code>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <StateCaption>Prose — measured at ~68ch with leading-relaxed</StateCaption>
        <p className="max-w-[68ch] text-base leading-relaxed text-ink-secondary">
          반려동물 케어 정보는 길게 읽히는 본문이 많습니다. 한 줄 길이는 65–75자(ch) 사이로 잡아
          시선이 다음 줄을 안정적으로 찾을 수 있게 했고, 줄 간격은 --leading-relaxed(1.75)로 호흡을
          줍니다. Body copy stays inside a comfortable measure so the reader&apos;s eye returns
          cleanly to the start of each line instead of drifting across the full viewport width.
        </p>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Spacing section                                                           */
/* -------------------------------------------------------------------------- */

const SPACING_TOKENS = [
  '--spacing-2xs',
  '--spacing-xs',
  '--spacing-sm',
  '--spacing-md',
  '--spacing-lg',
  '--spacing-xl',
  '--spacing-2xl',
  '--spacing-3xl',
] as const

function SpacingSection() {
  const resolved = useResolvedTokens(SPACING_TOKENS, 'static')
  return (
    <Section
      id="spacing"
      title="Spacing"
      description="A fluid spacing scale — each step is a clamp() that grows with the viewport, so rhythm holds from phone to desktop."
    >
      <div className="flex flex-col gap-3">
        {SPACING_TOKENS.map((token) => (
          <div key={token} className="flex items-center gap-4">
            <code className="w-32 shrink-0 text-xs text-ink-secondary">{token}</code>
            <div className="h-4 rounded-sm bg-brand" style={{ width: `var(${token})` }} />
            <code className="shrink-0 text-xs tabular-nums text-ink-muted">
              {resolved[token] ?? '…'}
            </code>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Radii section                                                             */
/* -------------------------------------------------------------------------- */

const RADII_TOKENS = [
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-pill',
] as const

function RadiiSection() {
  const resolved = useResolvedTokens(RADII_TOKENS, 'static')
  return (
    <Section id="radii" title="Radii" description="Corner radii from subtle (xs) to pill.">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
        {RADII_TOKENS.map((token) => (
          <div key={token} className="flex flex-col items-center gap-2">
            <div
              className="flex h-20 w-full items-center justify-center border border-line-strong bg-brand-soft"
              style={{ borderRadius: `var(${token})` }}
            />
            <div className="flex flex-col items-center">
              <code className="text-xs text-ink">{token}</code>
              <code className="text-xs tabular-nums text-ink-muted">{resolved[token] ?? '…'}</code>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Elevation section                                                         */
/* -------------------------------------------------------------------------- */

const SHADOW_TOKENS = ['--shadow-xs', '--shadow-sm', '--shadow-md', '--shadow-lg'] as const

function ElevationSection() {
  return (
    <Section
      id="elevation"
      title="Elevation"
      description="Layered shadows that deepen with surface height. Each token softens automatically in dark mode."
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-6 py-2">
        {SHADOW_TOKENS.map((token) => (
          <div key={token} className="flex flex-col items-center gap-3">
            <div
              className="flex h-24 w-full items-center justify-center rounded-lg border border-line bg-panel"
              style={{ boxShadow: `var(${token})` }}
            >
              <code className="text-xs text-ink-secondary">{token}</code>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Motion section                                                            */
/* -------------------------------------------------------------------------- */

const EASING_TOKENS = [
  { token: '--easing-expo', label: 'ease-expo', note: 'cubic-bezier(0.16, 1, 0.3, 1)' },
  { token: '--easing-quint', label: 'ease-quint', note: 'cubic-bezier(0.22, 1, 0.36, 1)' },
] as const

const DURATION_TOKENS = [
  { token: '--motion-fast', label: 'fast', note: '140ms' },
  { token: '--motion-base', label: 'base', note: '240ms' },
  { token: '--motion-slow', label: 'slow', note: '420ms' },
] as const

function MotionSection() {
  const reducedMotion = useReducedMotion()
  const [playing, setPlaying] = useState<string | null>(null)

  const play = useCallback((token: string) => {
    setPlaying(token)
    window.setTimeout(() => setPlaying((cur) => (cur === token ? null : cur)), 600)
  }, [])

  return (
    <Section
      id="motion"
      title="Motion"
      description="Decelerating ease-out curves only — no bounce. Every transition collapses to ~0ms under prefers-reduced-motion."
    >
      <Alert tone={reducedMotion ? 'warning' : 'info'} title="Reduced motion">
        {reducedMotion
          ? 'Your system requests reduced motion — the demos below skip their travel and snap to the end state.'
          : 'Motion is on. Enable “reduce motion” in your OS to see every demo fall back to an instant state change.'}
      </Alert>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Easing</Card.Title>
            <Card.Description>Click a curve to send the dot across the track.</Card.Description>
          </Card.Header>
          <Card.Body className="flex flex-col gap-4">
            {EASING_TOKENS.map(({ token, label, note }) => {
              const active = playing === token
              return (
                <div key={token} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-ink">{token}</code>
                    <Button size="sm" variant="soft" onClick={() => play(token)}>
                      Play {label}
                    </Button>
                  </div>
                  <div className="relative h-3 w-full rounded-full bg-panel-muted">
                    <span
                      className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-brand"
                      style={{
                        left: active ? 'calc(100% - 0.75rem)' : '0px',
                        transition: reducedMotion ? 'none' : `left 600ms var(${token})`,
                      }}
                    />
                  </div>
                  <code className="text-xs text-ink-muted">{note}</code>
                </div>
              )
            })}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Durations</Card.Title>
            <Card.Description>Composite tokens pairing a duration with an easing.</Card.Description>
          </Card.Header>
          <Card.Body className="flex flex-col gap-3">
            {DURATION_TOKENS.map(({ token, label, note }) => (
              <div key={token} className="flex items-center justify-between gap-3">
                <code className="text-xs text-ink">{token}</code>
                <Badge tone="neutral">{label}</Badge>
                <code className="text-xs tabular-nums text-ink-muted">{note}</code>
              </div>
            ))}
          </Card.Body>
        </Card>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Components gallery                                                        */
/* -------------------------------------------------------------------------- */

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'soft', 'outline', 'ghost', 'danger']
const BUTTON_SIZES: ButtonSize[] = ['sm', 'md', 'lg']

function GalleryGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-panel p-5">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {children}
    </div>
  )
}

function ComponentsSection() {
  const [switchOn, setSwitchOn] = useState(true)

  return (
    <Section
      id="components"
      title="Components"
      description="The real src/components/ui kit — Radix primitives wrapped with token-driven Tailwind. Every interactive state is shown, not just the happy path."
    >
      <div className="flex flex-col gap-5">
        {/* Buttons */}
        <GalleryGroup title="Button">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <StateCaption>Variants</StateCaption>
              <div className="flex flex-wrap items-center gap-3">
                {BUTTON_VARIANTS.map((v) => (
                  <Button key={v} variant={v}>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <StateCaption>Sizes</StateCaption>
              <div className="flex flex-wrap items-center gap-3">
                {BUTTON_SIZES.map((s) => (
                  <Button key={s} size={s}>
                    Size {s}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <StateCaption>Disabled</StateCaption>
              <div className="flex flex-wrap items-center gap-3">
                {BUTTON_VARIANTS.map((v) => (
                  <Button key={v} variant={v} disabled>
                    {v}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </GalleryGroup>

        {/* Form controls */}
        <GalleryGroup title="Field, Input &amp; Textarea">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field>
              <Field.Label>Default</Field.Label>
              <Field.Control>
                {(p) => <Input placeholder="leopardgecko@example.com" {...p} />}
              </Field.Control>
            </Field>

            <Field description="We use this to suggest nearby vets.">
              <Field.Label required>With description</Field.Label>
              <Field.Control>{(p) => <Input placeholder="Seoul, KR" {...p} />}</Field.Control>
            </Field>

            <Field error="Please enter a valid email address.">
              <Field.Label>Error state</Field.Label>
              <Field.Control>{(p) => <Input defaultValue="not-an-email" {...p} />}</Field.Control>
            </Field>

            <Field description="Disabled control.">
              <Field.Label>Disabled</Field.Label>
              <Field.Control>{(p) => <Input value="Read only" disabled {...p} />}</Field.Control>
            </Field>

            <div className="md:col-span-2">
              <Field description="Multi-line, vertically resizable.">
                <Field.Label>Textarea</Field.Label>
                <Field.Control>
                  {(p) => <Textarea placeholder="Notes about your pet…" {...p} />}
                </Field.Control>
              </Field>
            </div>
          </div>
        </GalleryGroup>

        {/* Switch + Label */}
        <GalleryGroup title="Switch &amp; Label">
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} id="ds-switch-md" />
              <Label htmlFor="ds-switch-md">Enabled (md)</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch size="sm" defaultChecked id="ds-switch-sm" />
              <Label htmlFor="ds-switch-sm">Small</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch disabled id="ds-switch-off" />
              <Label htmlFor="ds-switch-off">Disabled</Label>
            </div>
          </div>
        </GalleryGroup>

        {/* Tabs */}
        <GalleryGroup title="Tabs">
          <Tabs defaultValue="habitat">
            <Tabs.List aria-label="Care topics">
              <Tabs.Trigger value="habitat">Habitat</Tabs.Trigger>
              <Tabs.Trigger value="feeding">Feeding</Tabs.Trigger>
              <Tabs.Trigger value="health">Health</Tabs.Trigger>
              <Tabs.Trigger value="locked" disabled>
                Locked
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="habitat" className="text-sm leading-relaxed text-ink-secondary">
              Temperature gradients, humidity, and enclosure sizing per species.
            </Tabs.Content>
            <Tabs.Content value="feeding" className="text-sm leading-relaxed text-ink-secondary">
              Prey size, dusting schedules, and supplement rotation.
            </Tabs.Content>
            <Tabs.Content value="health" className="text-sm leading-relaxed text-ink-secondary">
              Warning signs, shedding issues, and when to see an exotics vet.
            </Tabs.Content>
          </Tabs>
        </GalleryGroup>

        {/* Badges + Alerts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GalleryGroup title="Badge">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>neutral</Badge>
              <Badge tone="brand">brand</Badge>
              <Badge tone="coral">coral</Badge>
              <Badge tone="success">success</Badge>
              <Badge tone="warning">warning</Badge>
              <Badge tone="error">error</Badge>
              <Badge tone="info">info</Badge>
            </div>
          </GalleryGroup>

          <GalleryGroup title="Progress">
            <div className="flex flex-col gap-3">
              <Progress value={30} tone="brand" />
              <Progress value={60} tone="success" />
              <Progress value={85} tone="warning" />
              <Progress value={45} tone="error" size="lg" />
            </div>
          </GalleryGroup>
        </div>

        <GalleryGroup title="Alert">
          <div className="flex flex-col gap-3">
            <Alert tone="info" title="Info">
              A new care guide for your species is available.
            </Alert>
            <Alert tone="success" title="Saved">
              Your enclosure profile was updated.
            </Alert>
            <Alert tone="warning" title="Heads up">
              Humidity has been below target for 3 days.
            </Alert>
            <Alert tone="error" title="Action needed">
              Your pet&apos;s vet record is missing a vaccination date.
            </Alert>
          </div>
        </GalleryGroup>

        {/* Card + Accordion */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GalleryGroup title="Card">
            <Card>
              <Card.Header>
                <Card.Title>Leopard gecko</Card.Title>
                <Card.Description>Eublepharis macularius</Card.Description>
              </Card.Header>
              <Card.Body className="text-sm leading-relaxed text-ink-secondary">
                Beginner-friendly, nocturnal, and tolerant of handling. Needs a warm hide and a
                28–30 °C basking spot.
              </Card.Body>
              <Card.Footer>
                <Button size="sm" variant="primary">
                  View care guide
                </Button>
                <Button size="sm" variant="ghost">
                  Save
                </Button>
              </Card.Footer>
            </Card>
          </GalleryGroup>

          <GalleryGroup title="Accordion">
            <Accordion type="single" collapsible defaultValue="item-1">
              <Accordion.Item value="item-1">
                <Accordion.Trigger>How often should I feed?</Accordion.Trigger>
                <Accordion.Content>
                  Juveniles eat daily; adults every 2–3 days. Adjust to body condition.
                </Accordion.Content>
              </Accordion.Item>
              <Accordion.Item value="item-2">
                <Accordion.Trigger>What humidity is ideal?</Accordion.Trigger>
                <Accordion.Content>
                  40–60% with a humid hide for shedding. Mist if it drops persistently.
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          </GalleryGroup>
        </div>

        {/* Empty + Skeleton */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <GalleryGroup title="EmptyState">
            <EmptyState
              icon={Inbox}
              title="No diary entries yet"
              description="Log your pet's first weigh-in to start tracking growth."
              action={
                <Button size="sm" variant="primary">
                  Add entry
                </Button>
              }
            />
          </GalleryGroup>

          <GalleryGroup title="Skeleton (loading)">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
            <Skeleton className="mt-2 h-24 w-full" />
          </GalleryGroup>
        </div>
      </div>
    </Section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

function Design() {
  useDocumentTitle('Design System')
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="mx-auto flex w-full max-w-[var(--layout-max)] flex-col gap-8 px-[var(--layout-pad)] py-10">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-line pb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand">pettography</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-ink">Design System</h1>
            <p className="max-w-[60ch] text-lg leading-normal text-ink-secondary">
              A living reference for the tokens and components that power the app — values resolve
              live from CSS, so this page is always true to production.
            </p>
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            {isDark ? 'Light' : 'Dark'}
          </Button>
        </div>
      </header>

      {/* Sticky in-page nav */}
      <nav
        aria-label="Design system sections"
        className="sticky top-2 z-10 -mx-1 flex gap-1 overflow-x-auto rounded-md border border-line bg-panel/90 p-1 shadow-sm backdrop-blur [-webkit-overflow-scrolling:touch]"
      >
        {NAV_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              'whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-ink-secondary',
              'transition-colors duration-150 ease-quint hover:bg-panel-muted hover:text-ink',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-app'
            )}
          >
            {s.label}
          </a>
        ))}
      </nav>

      <ColorSection />
      <TypographySection />
      <SpacingSection />
      <RadiiSection />
      <ElevationSection />
      <MotionSection />
      <ComponentsSection />
    </div>
  )
}

export default Design
