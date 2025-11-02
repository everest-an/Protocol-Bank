import { describe, it, expect } from 'vitest'
import {
  getContractExplorerLink,
  getTransactionExplorerLink,
  isSepolia,
  SEPOLIA_CONFIG
} from '../../config/contracts'

describe('Contract Utils', () => {
  describe('getContractExplorerLink', () => {
    it('returns correct Etherscan link for contract', () => {
      const address = '0x642B0c309358D083EE83748b4C22572aa28AebF7'
      const link = getContractExplorerLink(address)
      
      expect(link).toBe(`https://sepolia.etherscan.io/address/${address}`)
    })
  })

  describe('getTransactionExplorerLink', () => {
    it('returns correct Etherscan link for transaction', () => {
      const txHash = '0x1234567890abcdef'
      const link = getTransactionExplorerLink(txHash)
      
      expect(link).toBe(`https://sepolia.etherscan.io/tx/${txHash}`)
    })
  })

  describe('isSepolia', () => {
    it('returns true for Sepolia chain ID', () => {
      expect(isSepolia(11155111)).toBe(true)
      expect(isSepolia(SEPOLIA_CONFIG.chainId)).toBe(true)
    })

    it('returns false for other chain IDs', () => {
      expect(isSepolia(1)).toBe(false) // Mainnet
      expect(isSepolia(5)).toBe(false) // Goerli
      expect(isSepolia(137)).toBe(false) // Polygon
    })
  })

  describe('SEPOLIA_CONFIG', () => {
    it('has correct configuration', () => {
      expect(SEPOLIA_CONFIG.chainId).toBe(11155111)
      expect(SEPOLIA_CONFIG.chainIdHex).toBe('0xaa36a7')
      expect(SEPOLIA_CONFIG.name).toBe('Sepolia Test Network')
      expect(SEPOLIA_CONFIG.nativeCurrency.symbol).toBe('ETH')
      expect(SEPOLIA_CONFIG.nativeCurrency.decimals).toBe(18)
    })
  })
})

