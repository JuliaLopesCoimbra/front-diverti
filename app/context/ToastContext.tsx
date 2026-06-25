// /app/context/ToastContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ToastContextType {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  showToast: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
  closeToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  const showToast = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    let safe: string;
    if (typeof message === 'string') {
      safe = message;
    } else if (Array.isArray(message)) {
      safe = (message as any[]).map((e) => e?.msg ?? JSON.stringify(e)).join('; ');
    } else if (message && typeof message === 'object') {
      safe = (message as any).msg ?? (message as any).detail ?? JSON.stringify(message);
    } else {
      safe = String(message);
    }
    setMessage(safe);
    setSeverity(severity);
    setOpen(true);
  }, []);

  const closeToast = useCallback(() => {
    setOpen(false);
  }, []);

  return (
   <ToastContext.Provider value={{ open, message, severity, showToast, closeToast }}>
  {children}

  <Snackbar
    open={open}
    autoHideDuration={3000}
    onClose={closeToast}
    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
  >
    <Alert onClose={closeToast} severity={severity} variant="filled">
      {message}
    </Alert>
  </Snackbar>
</ToastContext.Provider>

  );
};
