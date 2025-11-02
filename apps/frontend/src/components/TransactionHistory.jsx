import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ExternalLink, 
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { getTransactionHistory } from '../services/etherscanService';

const TransactionHistory = ({ limit = 10 }) => {
  const { account, provider, chainId } = useWeb3();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, sent, received
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch transaction history from Etherscan API
  const fetchTransactions = async () => {
    if (!account || !chainId) return;

    setLoading(true);
    try {
      // Fetch transactions from Etherscan API
      const txs = await getTransactionHistory(account, chainId, {
        page: 1,
        offset: 100, // Get last 100 transactions
        sort: 'desc', // Most recent first
      });
      
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Set empty array on error so UI shows "No transactions"
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions on mount and when account/chainId changes
  useEffect(() => {
    fetchTransactions();
  }, [account, chainId]);

  // Get explorer URL based on chain ID
  const getExplorerUrl = (txHash) => {
    const explorers = {
      1: 'https://etherscan.io',
      5: 'https://goerli.etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com',
    };
    
    const baseUrl = explorers[chainId] || 'https://etherscan.io';
    return `${baseUrl}/tx/${txHash}`;
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    // Filter by type
    if (filter === 'sent' && tx.from.toLowerCase() !== account.toLowerCase()) {
      return false;
    }
    if (filter === 'received' && tx.to.toLowerCase() !== account.toLowerCase()) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        tx.hash.toLowerCase().includes(term) ||
        tx.from.toLowerCase().includes(term) ||
        tx.to.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Format address
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by address or tx hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'sent'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setFilter('received')}
              className={`px-3 py-1 rounded text-sm ${
                filter === 'received'
                  ? 'bg-white dark:bg-gray-700 shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Received
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Filter className="h-12 w-12" />}
            title="No transactions found"
            description={
              account
                ? "You don't have any transactions yet. Start by making your first payment!"
                : "Connect your wallet to view transaction history"
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredTransactions.slice(0, limit).map((tx, index) => {
              const isSent = tx.from.toLowerCase() === account.toLowerCase();
              
              return (
                <div
                  key={tx.hash || index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      isSent
                        ? 'bg-red-100 dark:bg-red-900/20'
                        : 'bg-green-100 dark:bg-green-900/20'
                    }`}>
                      {isSent ? (
                        <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">
                          {isSent ? 'Sent to' : 'Received from'}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {formatAddress(isSent ? tx.to : tx.from)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(tx.timestamp)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          tx.status === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : tx.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        isSent ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {isSent ? '-' : '+'}{tx.value} ETH
                      </div>
                      {tx.gasUsed && (
                        <div className="text-xs text-gray-500">
                          Gas: {tx.gasUsed}
                        </div>
                      )}
                    </div>

                    <a
                      href={getExplorerUrl(tx.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredTransactions.length > limit && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Transactions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;
