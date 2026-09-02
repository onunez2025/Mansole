import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import App from './App.jsx'

// Parche de seguridad para proteger a React contra modificaciones del DOM hechas por
// extensiones del navegador o traducción automática (evita la excepción removeChild / NotFoundError).
if (typeof window !== 'undefined') {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      if (console) console.warn('DOM removeChild prevenido por desfase de traducción o extensión', child);
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn('DOM insertBefore prevenido por desfase de traducción o extensión', newNode, referenceNode);
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

import { ToastProvider } from './providers/ToastProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
