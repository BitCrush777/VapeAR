// Production Error Boundary Component — Created by Saidarshan.K
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = (): void => {
    if (this.props.onReset) {
      this.setState({ hasError: false, error: null });
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'AR Experience Encountered an Issue';
      const message =
        this.props.fallbackMessage ||
        'A rendering or runtime exception occurred. You can safely reload the experience without losing permissions.';

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(5, 7, 12, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: 24,
            fontFamily: 'var(--font-sans, system-ui, sans-serif)'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              padding: '32px 28px',
              borderRadius: 24,
              backgroundColor: 'rgba(15, 18, 28, 0.92)',
              border: '1px solid rgba(255, 60, 60, 0.35)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 16px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 60, 60, 0.12)',
                border: '1px solid rgba(255, 60, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff4d4d'
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#ff4d4d',
                marginBottom: 6
              }}
            >
              RECOVERY MODE
            </div>

            <h2
              style={{
                margin: '0 0 12px',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#ffffff'
              }}
            >
              {title}
            </h2>

            <p
              style={{
                margin: '0 0 24px',
                fontSize: '0.84rem',
                color: 'rgba(255, 255, 255, 0.72)',
                lineHeight: 1.5
              }}
            >
              {message}
            </p>

            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 14,
                backgroundColor: '#d4af37',
                border: 'none',
                color: '#0a0d14',
                fontSize: '0.86rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'transform 0.15s ease, opacity 0.15s ease'
              }}
            >
              <RotateCcw size={16} />
              <span>RESTART EXPERIENCE</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
