import { useTranslation } from 'react-i18next'

interface SkipLinkProps {
  targetId?: string
  text?: string
}

function SkipLink({ targetId = 'main-content', text }: SkipLinkProps) {
  const { t } = useTranslation()
  return (
    <a href={`#${targetId}`} className="skip-link">
      {text ?? t('common.skipToContent')}
    </a>
  )
}

export default SkipLink
