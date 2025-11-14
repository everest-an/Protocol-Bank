import { useState, useCallback } from 'react';

/**
 * useClipboard Hook
 * 
 * A custom React hook for copying text to clipboard.
 * 
 * @param {number} resetDelay - Time in ms before resetting copied state (default: 2000)
 * @returns {object} - { copied, copyToClipboard }
 * 
 * @example
 * const { copied, copyToClipboard } = useClipboard();
 * 
 * <button onClick={() => copyToClipboard('0x123...')}>
 *   {copied ? 'Copied!' : 'Copy Address'}
 * </button>
 */
export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      // Reset copied state after delay
      setTimeout(() => {
        setCopied(false);
      }, resetDelay);
      
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setCopied(false);
      return false;
    }
  }, [resetDelay]);

  return { copied, copyToClipboard };
}

export default useClipboard;
