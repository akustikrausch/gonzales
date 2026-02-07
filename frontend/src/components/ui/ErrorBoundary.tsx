import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg-primary)]">
          <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              An unexpected error occurred. Please reload the page to try again.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-black/20 rounded-lg p-3 overflow-auto max-h-32 text-[var(--color-text-tertiary)]">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="glass-btn glass-btn-primary px-6 py-2.5 text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
