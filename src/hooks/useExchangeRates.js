import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing cryptocurrency exchange rates
 * Fetches real-time rates from CoinGecko API with Coinbase as fallback
 */
export function useExchangeRates() {
  const [rates, setRates] = useState({
    usd: 0,
    eur: 0,
    cny: 0,
    gbp: 0,
    jpy: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try CoinGecko API first
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,eur,cny,gbp,jpy'
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.ethereum) {
            setRates({
              usd: data.ethereum.usd,
              eur: data.ethereum.eur,
              cny: data.ethereum.cny,
              gbp: data.ethereum.gbp,
              jpy: data.ethereum.jpy,
            });
            setLastUpdated(new Date());
            setLoading(false);
            return;
          }
        }
      } catch (coinGeckoError) {
        console.warn('CoinGecko API failed, trying Coinbase...', coinGeckoError);
      }

      // Fallback to Coinbase API
      const coinbaseResponse = await fetch(
        'https://api.coinbase.com/v2/exchange-rates?currency=ETH'
      );
      
      if (!coinbaseResponse.ok) {
        throw new Error('Failed to fetch exchange rates from both APIs');
      }

      const coinbaseData = await coinbaseResponse.json();
      const coinbaseRates = coinbaseData.data.rates;

      setRates({
        usd: parseFloat(coinbaseRates.USD),
        eur: parseFloat(coinbaseRates.EUR),
        cny: parseFloat(coinbaseRates.CNY),
        gbp: parseFloat(coinbaseRates.GBP),
        jpy: parseFloat(coinbaseRates.JPY),
      });
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      // console.error('Error fetching exchange rates:', err);
      setError(err.message);
      setLoading(false);
      
      // Set fallback rates if both APIs fail
      setRates({
        usd: 3991.13,
        eur: 3650.00,
        cny: 28900.00,
        gbp: 3150.00,
        jpy: 580000.00,
      });
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    fetchRates();
    
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchRates]);

  const convertFromETH = useCallback((ethAmount, currency) => {
    if (!ethAmount || isNaN(ethAmount)) return 0;
    const rate = rates[currency.toLowerCase()];
    return ethAmount * rate;
  }, [rates]);

  const convertToETH = useCallback((amount, currency) => {
    if (!amount || isNaN(amount)) return 0;
    const rate = rates[currency.toLowerCase()];
    return amount / rate;
  }, [rates]);

  return {
    rates,
    loading,
    error,
    lastUpdated,
    convertFromETH,
    convertToETH,
    refreshRates: fetchRates,
  };
}

