import { Component } from 'react';
import logo from '../assets/logo.webp';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '16px',
          fontFamily: 'Inter, sans-serif', padding: '24px', textAlign: 'center',
          background: '#F7F7F5',
        }}>
          <img src={logo} alt="UniJobLink" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} />
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111', letterSpacing: '-0.02em', margin: 0 }}>Something went wrong.</h1>
          <p style={{ fontSize: '14px', color: '#666', maxWidth: '360px', margin: 0, lineHeight: '1.6' }}>
            An unexpected error occurred. Try reloading the page — if it keeps happening, please contact support.
          </p>
          <button onClick={() => window.location.reload()}
            style={{ background: '#C41E3A', color: '#fff', border: 'none', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
