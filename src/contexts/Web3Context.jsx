import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  connectWalletConnect, 
  disconnectWalletConnect, 
  isWalletConnectConnected,
  setupWalletConnectListeners,
  removeWalletConnectListeners
} from '../services/walletConnectService';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connectionType, setConnectionType] = useState(null); // 'metamask' or 'walletconnect'

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connectMetaMask = async () => {
    if (!isMetaMaskInstalled()) {
      setError('Please install MetaMask to use this feature');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setChainId(Number(network.chainId));
      setConnectionType('metamask');

      return true;
    } catch (err) {
      console.error('Error connecting to MetaMask:', err);
      setError(err.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect via WalletConnect
  const connectWC = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { provider: wcProvider, signer: wcSigner, account: wcAccount, chainId: wcChainId } = await connectWalletConnect();

      setAccount(wcAccount);
      setProvider(wcProvider);
      setSigner(wcSigner);
      setChainId(wcChainId);
      setConnectionType('walletconnect');

      // Setup event listeners
      setupWalletConnectListeners({
        onAccountsChanged: (accounts) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          } else {
            disconnectWallet();
          }
        },
        onChainChanged: (newChainId) => {
          setChainId(newChainId);
        },
        onDisconnect: () => {
          disconnectWallet();
        },
      });

      return true;
    } catch (err) {
      console.error('Error connecting to WalletConnect:', err);
      setError(err.message || 'Failed to connect via WalletConnect');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect wallet (default to MetaMask)
  const connectWallet = async (type = 'metamask') => {
    if (type === 'walletconnect') {
      return await connectWC();
    }
    return await connectMetaMask();
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    if (connectionType === 'walletconnect') {
      await disconnectWalletConnect();
      removeWalletConnectListeners();
    }
    
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setConnectionType(null);
    setError(null);
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (err) {
      console.error('Error switching network:', err);
      setError(err.message || 'Failed to switch network');
      return false;
    }
  };

  // Fetch balance
  const fetchBalance = async (address) => {
    if (!provider || !address) return '0';
    
    try {
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return '0';
    }
  };

  // Update balance when account or provider changes
  useEffect(() => {
    if (account && provider) {
      fetchBalance(account).then(setBalance);
      
      // Set up interval to update balance every 10 seconds
      const interval = setInterval(() => {
        fetchBalance(account).then(setBalance);
      }, 10000);
      
      return () => clearInterval(interval);
    } else {
      setBalance('0');
    }
  }, [account, provider]);

  // Get contract instance
  const getContract = (address, abi) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    return new ethers.Contract(address, abi, signer);
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      // Reload the page to reset state
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          // User was previously connected, reconnect
          await connectWallet();
        }
      } catch (err) {
        console.error('Error auto-connecting:', err);
      }
    };

    autoConnect();
  }, []);

  const value = {
    account,
    provider,
    signer,
    chainId,
    balance,
    isConnecting,
    error,
    connectionType,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getContract,
    refreshBalance: () => account && fetchBalance(account).then(setBalance),
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
