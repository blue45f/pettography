import i18next from 'i18next'
import { Component, ErrorInfo, ReactNode } from 'react'

import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className={styles.container}>
          <h2 className={styles.title}>
            {i18next.t('error.boundaryTitle', '문제가 발생했습니다')}
          </h2>
          <p className={styles.message}>
            {this.state.error?.message ||
              i18next.t('error.boundaryMessage', '알 수 없는 오류가 발생했습니다.')}
          </p>
          <button className={styles.button} onClick={this.handleReset}>
            {i18next.t('error.boundaryReset', '다시 시도')}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
