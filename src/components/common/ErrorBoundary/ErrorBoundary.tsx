import i18next from 'i18next'
import { Component, createRef } from 'react'

import styles from './ErrorBoundary.module.css'

import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly containerRef = createRef<HTMLDivElement>()

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  componentDidUpdate(_previousProps: ErrorBoundaryProps, previousState: ErrorBoundaryState) {
    if (!previousState.hasError && this.state.hasError) {
      this.containerRef.current?.focus()
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const message = this.state.error?.message?.trim()

      return (
        <div
          ref={this.containerRef}
          className={styles.container}
          role="alert"
          aria-labelledby="app-error-title"
          tabIndex={-1}
        >
          <p className={styles.code} aria-hidden="true">
            APP ERROR
          </p>
          <h1 id="app-error-title" className={styles.title}>
            {i18next.t('error.boundaryTitle', '문제가 발생했습니다')}
          </h1>
          <p className={styles.message}>{message ? message : '알 수 없는 오류가 발생했습니다.'}</p>
          <p className={styles.hint}>{i18next.t('error.boundaryHint')}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={this.handleReset}>
              {i18next.t('retry', '다시 시도')}
            </button>
            <a className={styles.secondaryAction} href="/">
              {i18next.t('error.boundaryHome')}
            </a>
            <a className={styles.textAction} href="/support">
              {i18next.t('error.boundarySupport')}
            </a>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
