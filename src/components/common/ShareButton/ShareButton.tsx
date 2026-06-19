import Button from '@components/common/Button'
import { useToast } from '@components/common/Toast'
import { useCallback, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { shareOrCopy, type ShareInput, type ShareResult } from '@/lib/share'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ShareButtonProps extends ShareInput {
  /** 버튼 라벨. 기본값은 i18n `common.share`. */
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  /** 접근성 라벨(아이콘만 있는 버튼 등). 미지정 시 children/기본 라벨. */
  'aria-label'?: string
  /** 결과 콜백(추가 후처리용). */
  onShared?: (result: ShareResult) => void
}

/**
 * 디자인 시스템 Button 위에 얹은 공유 버튼. 네이티브 공유 시트 또는 클립보드 복사를
 * 수행하고, 결과를 토스트로 안내한다(`copied` → "링크 복사됨", `unsupported` → 에러).
 * `dismissed`(사용자 취소)는 조용히 넘어간다.
 */
function ShareButton({
  children,
  variant = 'ghost',
  size = 'sm',
  className,
  onShared,
  'aria-label': ariaLabel,
  ...input
}: ShareButtonProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const handleClick = useCallback(async () => {
    const result = await shareOrCopy(input)
    onShared?.(result)
    if (result === 'copied') toast(t('common.linkCopied'), 'success')
    else if (result === 'unsupported') toast(t('common.shareUnsupported'), 'error')
  }, [input, onShared, t, toast])

  const label = children ?? t('common.share')

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
    >
      <span aria-hidden="true">↗</span> {label}
    </Button>
  )
}

export default ShareButton
