import { LogIn, LogOut, User as UserIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { AuthDialog, useAuth } from '@/lib/firebaseAuth'
import { cn } from '@/utils/cn'

/**
 * 헤더 회원 로그인 진입점 — Firebase Auth 기반(통합 로그인 모듈).
 *
 * 이 컨트롤은 기존 커스텀 계정 로그인(`domains/auth` → AdminGate, JWT)과 **별개**다.
 * 그 흐름은 그대로 두고, 통합 Firebase 로그인(이메일/비번 + 게스트)을 **추가** 옵션으로 제공한다.
 * 로그아웃 상태면 "로그인" 버튼으로 AuthDialog 를 열고, 로그인 상태면 이메일(또는
 * "게스트")과 로그아웃을 보여준다.
 */
function MemberAuthControl({ className }: { className?: string }) {
  const { user, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) {
    // 초기 onAuthStateChanged 해석 전 — 레이아웃 점프 방지용 플레이스홀더.
    return (
      <div
        className={cn('h-8 w-20 animate-pulse rounded-md bg-panel-muted', className)}
        aria-hidden
      />
    )
  }

  if (!user) {
    return (
      <div className={className}>
        <Button variant="soft" size="sm" onClick={() => setOpen(true)}>
          <LogIn aria-hidden />
          <span className="hidden sm:inline">로그인</span>
        </Button>
        <AuthDialog open={open} onOpenChange={setOpen} />
      </div>
    )
  }

  const label = user.isAnonymous ? '게스트' : (user.email ?? '회원')

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className="hidden max-w-[12rem] items-center gap-1.5 truncate rounded-md bg-panel-muted px-2.5 py-1 text-sm text-ink-muted sm:inline-flex"
        title={label}
      >
        <UserIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void signOut()}
        aria-label={`${label} 로그아웃`}
        title="로그아웃"
      >
        <LogOut aria-hidden />
      </Button>
    </div>
  )
}

export default MemberAuthControl
