import React from 'react';
import { Toaster } from 'sonner';

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        theme="system"
        richColors
        closeButton
        expand={true}
        style={{
          '--normal-bg': 'hsl(0 0% 100%)',
          '--normal-border': 'hsl(240 5.9% 90%)',
          '--normal-text': 'hsl(240 10% 3.9%)',
        }}
      />
    </>
  );
}

// Hook para usar notificaciones
export { toast } from 'sonner';
