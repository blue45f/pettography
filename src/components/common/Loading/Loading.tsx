import styles from './Loading.module.css'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

function Loading({ size = 'md', text = '로딩 중...' }: LoadingProps) {
  return (
    <div className={styles.container} role="status" aria-label={text || '로딩 중'}>
      <div className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  )
}

export default Loading
