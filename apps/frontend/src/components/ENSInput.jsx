import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { resolveAddressOrENS, isValidAddress, isValidENSName } from '../utils/ensResolver';

export default function ENSInput({ 
  value, 
  onChange, 
  onResolvedAddress,
  provider, 
  placeholder = "Enter address or ENS name",
  className = "",
  disabled = false 
}) {
  const [resolving, setResolving] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const resolveInput = async () => {
      if (!value || !provider) {
        setResolvedAddress(null);
        setError(null);
        return;
      }

      // If it's already a valid address, no need to resolve
      if (isValidAddress(value)) {
        setResolvedAddress(value);
        setError(null);
        if (onResolvedAddress) {
          onResolvedAddress(value);
        }
        return;
      }

      // If it's an ENS name, resolve it
      if (isValidENSName(value)) {
        setResolving(true);
        setError(null);
        
        try {
          const address = await resolveAddressOrENS(value, provider);
          if (address) {
            setResolvedAddress(address);
            setError(null);
            if (onResolvedAddress) {
              onResolvedAddress(address);
            }
          } else {
            setResolvedAddress(null);
            setError('ENS name not found');
            if (onResolvedAddress) {
              onResolvedAddress(null);
            }
          }
        } catch (err) {
          // console.error('Error resolving ENS:', err);
          setResolvedAddress(null);
          setError('Failed to resolve ENS name');
          if (onResolvedAddress) {
            onResolvedAddress(null);
          }
        } finally {
          setResolving(false);
        }
      } else {
        setResolvedAddress(null);
        setError('Invalid address or ENS name');
        if (onResolvedAddress) {
          onResolvedAddress(null);
        }
      }
    };

    // Debounce resolution
    const timeoutId = setTimeout(resolveInput, 500);
    return () => clearTimeout(timeoutId);
  }, [value, provider, onResolvedAddress]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50 ${className}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {resolving && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          {!resolving && resolvedAddress && (
            <Check className="w-5 h-5 text-green-500" />
          )}
          {!resolving && error && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>
      
      {resolvedAddress && resolvedAddress !== value && (
        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <Check className="w-4 h-4" />
          <span>
            Resolved to: {resolvedAddress.slice(0, 10)}...{resolvedAddress.slice(-8)}
          </span>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        You can enter an Ethereum address (0x...) or an ENS name (name.eth)
      </p>
    </div>
  );
}

