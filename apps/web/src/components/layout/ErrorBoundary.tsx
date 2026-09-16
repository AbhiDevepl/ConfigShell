import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render error so a bug in one component does not blank the page.
 *
 * Deliberately plain: no theme tokens, no shadcn primitives, no hooks. Whatever
 * broke may well be the design system or a provider above it, so the fallback
 * uses inline styles and nothing else from this app. A fallback that can itself
 * fail is not a fallback.
 *
 * React has no hook equivalent — an error boundary must be a class component.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // The console is all there is: ConfigShell collects no telemetry and sends
    // nothing anywhere, which is a privacy property worth keeping (PRD §26).
    console.error('ConfigShell hit a render error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          maxWidth: '38rem',
          margin: '4rem auto',
          padding: '1.5rem',
          fontFamily: 'system-ui, sans-serif',
          lineHeight: 1.5,
        }}
      >
        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
          Something went wrong
        </h1>
        <p style={{ margin: '0 0 1rem' }}>
          ConfigShell hit an error while rendering. Nothing was installed and nothing on your
          system was changed — this app only ever displays commands for you to run yourself.
        </p>
        <p style={{ margin: '0 0 1rem' }}>
          Reloading usually clears it. The details are in your browser console.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 0.875rem',
            borderRadius: '0.5rem',
            border: '1px solid currentColor',
            background: 'transparent',
            font: 'inherit',
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
