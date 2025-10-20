import { useEffect, useCallback, useState } from 'react';
import { ethers } from 'ethers';

/**
 * Hook for listening to smart contract events in real-time
 * @param {ethers.Contract} contract - The contract instance
 * @param {Function} onEvent - Callback when event is received
 */
export function useContractEvents(contract, onEvent) {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!contract) return;

    setIsListening(true);

    // Listen for SupplierRegistered events
    const handleSupplierRegistered = (wallet, name, brand, category, event) => {
      console.log('🎉 New supplier registered:', { wallet, name, brand, category });
      onEvent?.({
        type: 'SupplierRegistered',
        data: { wallet, name, brand, category },
        event,
      });
    };

    // Listen for PaymentCreated events
    const handlePaymentCreated = (id, from, to, amount, category, timestamp, event) => {
      console.log('💸 New payment created:', {
        id: Number(id),
        from,
        to,
        amount: ethers.formatEther(amount),
        category,
        timestamp: Number(timestamp),
      });
      onEvent?.({
        type: 'PaymentCreated',
        data: {
          id: Number(id),
          from,
          to,
          amount: ethers.formatEther(amount),
          category,
          timestamp: Number(timestamp),
        },
        event,
      });
    };

    // Listen for PaymentStatusUpdated events
    const handlePaymentStatusUpdated = (id, status, event) => {
      console.log('🔄 Payment status updated:', {
        id: Number(id),
        status: ['Pending', 'Completed', 'Failed'][Number(status)],
      });
      onEvent?.({
        type: 'PaymentStatusUpdated',
        data: {
          id: Number(id),
          status: ['Pending', 'Completed', 'Failed'][Number(status)],
        },
        event,
      });
    };

    // Attach event listeners
    contract.on('SupplierRegistered', handleSupplierRegistered);
    contract.on('PaymentCreated', handlePaymentCreated);
    contract.on('PaymentStatusUpdated', handlePaymentStatusUpdated);

    // Cleanup
    return () => {
      setIsListening(false);
      contract.off('SupplierRegistered', handleSupplierRegistered);
      contract.off('PaymentCreated', handlePaymentCreated);
      contract.off('PaymentStatusUpdated', handlePaymentStatusUpdated);
    };
  }, [contract, onEvent]);

  return { isListening };
}

/**
 * Hook for real-time notifications
 */
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    setNotifications((prev) => [
      ...prev,
      { id, ...notification, timestamp: new Date() },
    ]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
}

