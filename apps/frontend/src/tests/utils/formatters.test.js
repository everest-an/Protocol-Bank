/**
 * Formatters Utility Tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatCompactNumber,
  formatPercentage,
  truncateAddress,
  formatWeiToEther,
  formatEtherToWei
} from '../../utils/formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format number as currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should handle string input', () => {
      expect(formatCurrency('1000')).toBe('$1,000.00');
    });

    it('should handle invalid input', () => {
      expect(formatCurrency('invalid')).toBe('$0.00');
      expect(formatCurrency(null)).toBe('$0.00');
    });
  });

  describe('formatNumber', () => {
    it('should format number with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle decimals', () => {
      expect(formatNumber(1234.56, 2)).toBe('1,234.56');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format large numbers with suffixes', () => {
      expect(formatCompactNumber(1000)).toBe('1.0K');
      expect(formatCompactNumber(1000000)).toBe('1.0M');
      expect(formatCompactNumber(1000000000)).toBe('1.0B');
    });

    it('should handle small numbers', () => {
      expect(formatCompactNumber(500)).toBe('500');
    });
  });

  describe('formatPercentage', () => {
    it('should format decimal as percentage', () => {
      expect(formatPercentage(0.5)).toBe('50.00%');
      expect(formatPercentage(0.1234)).toBe('12.34%');
    });

    it('should handle non-decimal input', () => {
      expect(formatPercentage(50, false)).toBe('50.00%');
    });
  });

  describe('truncateAddress', () => {
    it('should truncate Ethereum address', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      expect(truncateAddress(address)).toBe('0x742d...f0bEb');
    });

    it('should handle custom lengths', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      expect(truncateAddress(address, 4, 4)).toBe('0x74...0bEb');
    });

    it('should handle short addresses', () => {
      expect(truncateAddress('0x123')).toBe('0x123');
    });
  });

  describe('formatWeiToEther', () => {
    it('should convert Wei to Ether', () => {
      expect(formatWeiToEther(1000000000000000000)).toBe('1.0000');
      expect(formatWeiToEther('1000000000000000000')).toBe('1.0000');
    });
  });

  describe('formatEtherToWei', () => {
    it('should convert Ether to Wei', () => {
      expect(formatEtherToWei(1)).toBe('1000000000000000000');
      expect(formatEtherToWei('1')).toBe('1000000000000000000');
    });
  });
});
