import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  role = 'dialog',
  ariaLabelledBy,
  ariaDescribedBy,
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Guardar elemento activo anterior
    previousActiveElement.current = document.activeElement;

    // Enfocar el modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Manejar ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Prevenir scroll del body
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0';

      // Restaurar foco
      if (previousActiveElement.current?.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  const modalId = `modal-${Math.random().toString(36).substr(2, 9)}`;
  const titleId = `${modalId}-title`;
  const descId = `${modalId}-desc`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      role="presentation"
      aria-hidden={!open}
    >
      <div
        ref={modalRef}
        className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl ${sizes[size]} w-full animate-scaleIn`}
        onClick={(e) => e.stopPropagation()}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || titleId}
        aria-describedby={ariaDescribedBy || descId}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 id={titleId} className="text-xl font-bold text-neutral-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-smooth"
            aria-label="Cerrar diálogo"
            type="button"
          >
            <X size={20} className="text-neutral-500" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div id={descId} className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/30 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
