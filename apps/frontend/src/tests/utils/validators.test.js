/**
 * Validators Utility Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isValidAddress,
  isValidEmail,
  isPositiveNumber,
  isValidTxHash,
  validatePaymentAmount
} from '../../utils/validators';

describe('validators', () => {
  describe('isValidAddress', () => {
    it('should validate correct Ethereum address', () => {
      expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb')).toBe(true);
      expect(isValidAddress('0x0000000000000000000000000000000000000000')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress(null)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100.5)).toBe(true);
      expect(isPositiveNumber('50')).toBe(true);
    });

    it('should reject non-positive numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber('invalid')).toBe(false);
    });
  });

  describe('isValidTxHash', () => {
    it('should validate correct transaction hash', () => {
      const validHash = '0x' + 'a'.repeat(64);
      expect(isValidTxHash(validHash)).toBe(true);
    });

    it('should reject invalid hashes', () => {
      expect(isValidTxHash('0x123')).toBe(false);
      expect(isValidTxHash('invalid')).toBe(false);
      expect(isValidTxHash('')).toBe(false);
    });
  });

  describe('validatePaymentAmount', () => {
    it('should validate correct amount', () => {
      const result = validatePaymentAmount(100);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should reject zero or negative amount', () => {
      const result1 = validatePaymentAmount(0);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBeTruthy();

      const result2 = validatePaymentAmount(-10);
      expect(result2.isValid).toBe(false);
    });

    it('should validate min/max constraints', () => {
      const result1 = validatePaymentAmount(50, 100, 1000);
      expect(result1.isValid).toBe(false);

      const result2 = validatePaymentAmount(2000, 100, 1000);
      expect(result2.isValid).toBe(false);

      const result3 = validatePaymentAmount(500, 100, 1000);
      expect(result3.isValid).toBe(true);
    });
  });
});
