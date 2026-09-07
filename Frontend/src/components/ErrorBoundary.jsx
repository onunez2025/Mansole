import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9FAFB',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '560px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E5E7EB',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                Interrupción en el Navegador
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px', lineHeight: 1.5 }}>
              La aplicación se pausó temporalmente debido a una intervención del navegador (traductor automático o extensión) o a un dato imprevisto.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#DC2626',
                maxHeight: '140px',
                overflowY: 'auto',
                wordBreak: 'break-word'
              }}>
                <strong>Detalle:</strong> {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('tokens');
                  } catch (e) {}
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  fontWeight: 600,
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Limpiar Caché y Reiniciar
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Recargar Aplicación
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
