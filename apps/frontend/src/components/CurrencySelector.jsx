import { useState, useRef, useEffect } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';

const CURRENCIES = [
  { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', flag: '⟠' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
];

export default function CurrencySelector({ 
  selectedCurrency, 
  onCurrencyChange, 
  lastUpdated,
  onRefresh,
  loading 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedCurrencyData = CURRENCIES.find(c => c.code === selectedCurrency) || CURRENCIES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000); // seconds
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-xl">{selectedCurrencyData.flag}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {selectedCurrencyData.code}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Exchange Rates</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh?.();
                }}
                className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>{formatLastUpdated()}</span>
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => {
                  onCurrencyChange(currency.code);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedCurrency === currency.code
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <span className="text-2xl">{currency.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {currency.code}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {currency.name}
                  </div>
                </div>
                {selectedCurrency === currency.code && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

