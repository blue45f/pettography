import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import { useAuth } from './useAuth'

import Modal from '@/components/common/Modal'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'

type Mode = 'signin' | 'signup'

const COPY: Record<Mode, { title: string; desc: string; submit: string; toggle: string }> = {
  signin: {
    title: '회원 로그인',
    desc: '이메일과 비밀번호로 로그인하세요. 계정이 없다면 가입하거나 게스트로 시작할 수 있습니다.',
    submit: '로그인',
    toggle: '계정이 없나요? 가입하기',
  },
  signup: {
    title: '회원가입',
    desc: '이메일과 비밀번호로 새 계정을 만드세요. 비밀번호는 6자 이상이어야 합니다.',
    submit: '가입하기',
    toggle: '이미 계정이 있나요? 로그인',
  },
}

/**
 * Firebase 이메일/비밀번호 + 게스트 로그인 다이얼로그 — 접근성 우선.
 * - 로그인 ⇄ 가입 토글, "게스트로 시작하기"(익명 인증)
 * - 로딩/비활성 상태, aria-live 에러
 * - 포커스: 공용 Modal 이 트랩, 열릴 때 이메일 입력에 초기 포커스
 *
 * 통합 로그인 모듈(`src/lib/firebaseAuth/`)의 한 파일 — useAuth API 와 한국어 에러
 * 매핑은 캐노니컬 모듈과 동일하고, UI 프리미티브(Modal·Button·Field·Input)와
 * 디자인 토큰만 이 앱(pettography)에 맞췄다.
 */
export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { signIn, signUp, signInAsGuest, error, clearError, user } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'form' | 'guest' | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  // 로그인 성공 시 자동으로 닫힌다(prop 콜백 호출 — setState 아님).
  useEffect(() => {
    if (open && user) onOpenChange(false)
  }, [open, user, onOpenChange])

  // 열릴 때 이메일 입력으로 초기 포커스(Modal 기본 포커스 대신).
  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => emailRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open])

  /**
   * 닫을 때 폼/에러를 초기화한다 — 다음 열림이 항상 깨끗한 상태로 시작.
   */
  function handleClose() {
    setMode('signin')
    setBusy(null)
    setEmail('')
    setPassword('')
    clearError()
    onOpenChange(false)
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    clearError()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy('form')
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
    } catch {
      // 에러는 컨텍스트 state(error)로 노출 — 여기선 무시.
    } finally {
      setBusy(null)
    }
  }

  async function onGuest() {
    if (busy) return
    setBusy('guest')
    try {
      await signInAsGuest()
    } catch {
      // 위와 동일.
    } finally {
      setBusy(null)
    }
  }

  const copy = COPY[mode]
  const formBusy = busy === 'form'
  const guestBusy = busy === 'guest'
  const anyBusy = busy !== null

  return (
    <Modal isOpen={open} onClose={handleClose} title={copy.title} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-snug text-ink-muted">
          <span className="mr-2 inline-grid size-7 place-items-center rounded-md bg-brand-soft align-middle text-brand">
            {mode === 'signup' ? (
              <UserPlus className="size-4" aria-hidden />
            ) : (
              <LogIn className="size-4" aria-hidden />
            )}
          </span>
          {copy.desc}
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
          <Field id={emailId}>
            <Field.Label required>이메일</Field.Label>
            <Field.Control>
              {(controlProps) => (
                <Input
                  {...controlProps}
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-describedby={error ? errorId : undefined}
                  aria-invalid={error ? true : undefined}
                  required
                  disabled={anyBusy}
                />
              )}
            </Field.Control>
          </Field>

          <Field id={passwordId}>
            <Field.Label required>비밀번호</Field.Label>
            <Field.Control>
              {(controlProps) => (
                <Input
                  {...controlProps}
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  aria-describedby={error ? errorId : undefined}
                  aria-invalid={error ? true : undefined}
                  required
                  disabled={anyBusy}
                />
              )}
            </Field.Control>
          </Field>

          {/* 에러는 항상 같은 노드에 두어 aria-live 가 안정적으로 announce 한다. */}
          <div aria-live="assertive">
            {error ? (
              <p
                id={errorId}
                role="alert"
                className="rounded-md border border-state-error/40 bg-coral-soft px-3 py-2 text-sm text-state-error"
              >
                {error}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={anyBusy || !email || !password}
            aria-busy={formBusy || undefined}
          >
            {formBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {copy.submit}
          </Button>
        </form>

        <button
          type="button"
          onClick={switchMode}
          disabled={anyBusy}
          className="w-full text-center text-sm font-medium text-brand transition-colors duration-150 ease-quint hover:underline disabled:pointer-events-none disabled:opacity-50"
        >
          {copy.toggle}
        </button>

        <div className="flex items-center gap-3 text-ink-muted">
          <span className="h-px flex-1 bg-line" aria-hidden />
          <span className="text-xs">또는</span>
          <span className="h-px flex-1 bg-line" aria-hidden />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onGuest}
          disabled={anyBusy}
          aria-busy={guestBusy || undefined}
        >
          {guestBusy ? <Loader2 className="animate-spin" aria-hidden /> : null}
          게스트로 시작하기
        </Button>
      </div>
    </Modal>
  )
}
