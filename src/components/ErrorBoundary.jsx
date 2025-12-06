/**
 * Error Boundary Component
 * Catches errors and displays a friendly error message
 */
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#000',
          color: '#FFFFFF',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️ Something went wrong</h1>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #0066FF 0%, #003366 100%)',
              border: '2px solid #00FFFF',
              borderRadius: '10px',
              color: '#FFFFFF',
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.6)',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

