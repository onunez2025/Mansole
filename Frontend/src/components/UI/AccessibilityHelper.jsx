import React, { useState, useEffect } from 'react';

/**
 * AccessibilityHelper - Utilidad para mejorar accesibilidad
 * Proporciona funciones para testeo y validación de WCAG
 */

export function AccessibilityHelper() {
  const [issues, setIssues] = useState([]);

  // Verificar contraste
  const checkContrast = (foreground, background) => {
    const fgColor = getComputedStyle(foreground);
    const bgColor = getComputedStyle(background);

    // Convertir a RGB
    const fgRGB = fgColor.color;
    const bgRGB = bgColor.backgroundColor;

    // Calcular luminosidad relativa
    const getLuminosity = (rgb) => {
      const [r, g, b] = rgb.match(/\d+/g).map(Number);
      const [rs, gs, bs] = [r, g, b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminosity(fgRGB);
    const lum2 = getLuminosity(bgRGB);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
  };

  // Verificar keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Log para debugging en console
      if (process.env.NODE_ENV === 'development') {
        console.log('Key pressed:', e.key, 'Target:', e.target);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Validar ARIA
  const validateAria = () => {
    const newIssues = [];

    // Verificar buttons sin aria-label o texto
    document.querySelectorAll('button').forEach((btn) => {
      if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
        newIssues.push({
          type: 'ARIA',
          severity: 'high',
          message: 'Button sin aria-label o texto visible',
          element: btn,
        });
      }
    });

    // Verificar inputs sin labels
    document.querySelectorAll('input').forEach((input) => {
      if (input.type !== 'hidden' && !document.querySelector(`label[for="${input.id}"]`)) {
        if (!input.getAttribute('aria-label')) {
          newIssues.push({
            type: 'ARIA',
            severity: 'high',
            message: 'Input sin label o aria-label',
            element: input,
          });
        }
      }
    });

    setIssues(newIssues);
    return newIssues;
  };

  // Hook para focus management
  return {
    validateAria,
    checkContrast,
    issues,
  };
}

// Hook para keyboard navigation
export function useKeyboardNavigation(ref) {
  useEffect(() => {
    if (!ref.current) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        ref.current?.dispatchEvent(new Event('close'));
      }
    };

    ref.current.addEventListener('keydown', handleKeyDown);
    return () => ref.current?.removeEventListener('keydown', handleKeyDown);
  }, [ref]);
}

// Hook para focus management
export function useFocusManagement() {
  const previousActiveElement = React.useRef(null);

  const captureFocus = () => {
    previousActiveElement.current = document.activeElement;
  };

  const restoreFocus = () => {
    if (previousActiveElement.current?.focus) {
      previousActiveElement.current.focus();
    }
  };

  return { captureFocus, restoreFocus };
}

// Utility para generar IDs único
export function useUniqueId(prefix = 'element') {
  return React.useMemo(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`, [prefix]);
}
