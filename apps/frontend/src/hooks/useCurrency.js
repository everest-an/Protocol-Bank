import { useState, useEffect } from 'react';

// 法币配置
export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
  CNY: { symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  ETH: { symbol: 'Ξ', name: 'Ethereum', decimals: 4 },
};

// Simulate汇率数据 (实际应该从 API 获取)
const MOCK_RATES = {
  ETH_USD: 2000,
  ETH_EUR: 1850,
  ETH_CNY: 14500,
  ETH_GBP: 1600,
  ETH_JPY: 290000,
};

/**
 * Hook for currency conversion and formatting
 */
export function useCurrency() {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [rates, setRates] = useState(MOCK_RATES);
  const [loading, setLoading] = useState(false);

  // 获取实时汇率 (可以接入真实 API)
  const fetchRates = async () => {
    setLoading(true);
    try {
      // TODO: 接入真实汇率 API (如 CoinGecko, CryptoCompare)
      // const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,eur,cny,gbp,jpy');
      // const data = await response.json();
      
      // 暂时使用Simulate数据
      await new Promise(resolve => setTimeout(resolve, 500));
      setRates(MOCK_RATES);
    } catch (error) {
      // console.error('Failed to fetch rates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Per Minute更新一次汇率
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // ETH 转法币
  const ethToFiat = (ethAmount, currency = selectedCurrency) => {
    const rate = rates[`ETH_${currency}`];
    if (!rate) return 0;
    return parseFloat(ethAmount) * rate;
  };

  // 法币转 ETH
  const fiatToEth = (fiatAmount, currency = selectedCurrency) => {
    const rate = rates[`ETH_${currency}`];
    if (!rate) return 0;
    return parseFloat(fiatAmount) / rate;
  };

  // 格式化Amount
  const formatAmount = (amount, currency = selectedCurrency) => {
    const config = CURRENCIES[currency];
    if (!config) return amount;

    const formatted = parseFloat(amount).toFixed(config.decimals);
    return `${config.symbol}${formatted}`;
  };

  // 格式化 ETH Amount并显示法币等值
  const formatEthWithFiat = (ethAmount, currency = selectedCurrency) => {
    const fiatAmount = ethToFiat(ethAmount, currency);
    return {
      eth: `${parseFloat(ethAmount).toFixed(4)} ETH`,
      fiat: formatAmount(fiatAmount, currency),
      combined: `${parseFloat(ethAmount).toFixed(4)} ETH (${formatAmount(fiatAmount, currency)})`,
    };
  };

  return {
    selectedCurrency,
    setSelectedCurrency,
    rates,
    loading,
    ethToFiat,
    fiatToEth,
    formatAmount,
    formatEthWithFiat,
    currencies: CURRENCIES,
    refreshRates: fetchRates,
  };
}

