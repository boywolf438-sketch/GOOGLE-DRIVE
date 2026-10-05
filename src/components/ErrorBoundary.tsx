import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button, Card } from './ui'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Keeps a rendering error inside one screen instead of blanking the whole app.
 * Demo data can always be restored from Settings if state gets corrupted.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[MADRASAT IBNUHAJAR] Screen crashed:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <Card className="mx-auto mt-6 max-w-xl p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h2 className="mt-3 text-base font-bold text-navy-900">Something went wrong on this screen</h2>
        <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-navy-500">
          The rest of the app is still working. You can try again, or open Settings to restore the original demo data.
        </p>
        <pre className="scroll-slim mt-4 max-h-32 overflow-auto rounded-xl bg-navy-50 p-3 text-left text-[11px] text-navy-600">
          {error.message}
        </pre>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            variant="success"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            Back to dashboard
          </Button>
        </div>
      </Card>
    )
  }
}

export default ErrorBoundary
