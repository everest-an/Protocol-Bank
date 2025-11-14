import { useState, useEffect, useCallback } from 'react';

/**
 * useAsync Hook
 * 
 * A custom React hook for handling async operations with loading, error, and data states.
 * 
 * @param {Function} asyncFunction - The async function to execute
 * @param {boolean} immediate - Whether to execute immediately (default: true)
 * @returns {object} - { execute, loading, data, error }
 * 
 * @example
 * const fetchData = async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * };
 * 
 * const { execute, loading, data, error } = useAsync(fetchData);
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export function useAsync(asyncFunction, immediate = true) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // The execute function wraps asyncFunction and handles setting state
  const execute = useCallback(
    async (...params) => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await asyncFunction(...params);
        setData(response);
        return response;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  // Call execute if we want to fire it right away
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, loading, data, error };
}

export default useAsync;
