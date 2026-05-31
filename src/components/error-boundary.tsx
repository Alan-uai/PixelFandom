'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error('[ErrorBoundary] Caught:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="max-w-2xl mx-auto p-6">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
            <h2 className="text-lg font-bold text-destructive mb-2">Erro ao carregar</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Ocorreu um erro ao carregar esta página.
            </p>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium">Detalhes do erro</summary>
              <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-48 p-2 rounded bg-background/50">
                {this.state.error.message}
                {this.state.info?.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
