import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWeb3 } from '../../hooks/useWeb3'

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
}

describe('useWeb3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.ethereum = mockEthereum
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useWeb3())
    
    expect(result.current.account).toBeNull()
    expect(result.current.chainId).toBeNull()
    expect(result.current.isConnected).toBe(false)
  })

  it('connects to wallet successfully', async () => {
    const mockAccount = '0x1234567890123456789012345678901234567890'
    mockEthereum.request.mockResolvedValueOnce([mockAccount])
    mockEthereum.request.mockResolvedValueOnce('0xaa36a7') // Sepolia chainId

    const { result } = renderHook(() => useWeb3())

    await act(async () => {
      await result.current.connect()
    })

    expect(result.current.account).toBe(mockAccount.toLowerCase())
    expect(result.current.isConnected).toBe(true)
  })

  it('handles connection error', async () => {
    mockEthereum.request.mockRejectedValueOnce(new Error('User rejected'))

    const { result } = renderHook(() => useWeb3())

    await act(async () => {
      await result.current.connect()
    })

    expect(result.current.account).toBeNull()
    expect(result.current.isConnected).toBe(false)
  })

  it('disconnects wallet', async () => {
    const { result } = renderHook(() => useWeb3())

    await act(async () => {
      result.current.disconnect()
    })

    expect(result.current.account).toBeNull()
    expect(result.current.isConnected).toBe(false)
  })
})

