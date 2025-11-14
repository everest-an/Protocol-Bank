import { useState, useCallback } from 'react';

/**
 * useToast Hook
 * 
 * A custom React hook for managing toast notifications.
 * 
 * @returns {object} - { toasts, showToast, hideToast, clearToasts }
 * 
 * @example
 * const { toasts, showToast } = useToast();
 * 
 * showToast('Payment successful!', 'success');
 * showToast('Transaction failed', 'error');
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);

    // Auto-hide toast after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
    clearToasts
  };
}

export default useToast;
