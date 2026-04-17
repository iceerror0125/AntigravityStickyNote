import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends React.Component<{children: any}, {hasError: boolean, error: any, extraInfo: string}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, extraInfo: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    this.setState({ extraInfo: info.componentStack });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#f87171', fontFamily: 'monospace' }}>
          <h3>React Extension Crashed</h3>
          <p>{this.state.error?.toString()}</p>
          <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', opacity: 0.7 }}>{this.state.extraInfo}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '4px 12px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer', marginTop: 10 }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
