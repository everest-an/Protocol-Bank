// Notification Service for Protocol Bank
// Monitors blockchain events and provides in-app notifications

import { ethers } from 'ethers';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.eventListeners = new Map();
  }

  /**
   * Initialize notification service with provider and contract
   * @param {object} provider - ethers provider
   * @param {object} contract - ethers contract instance
   */
  initialize(provider, contract) {
    this.provider = provider;
    this.contract = contract;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for contract events
   */
  setupEventListeners() {
    if (!this.contract) return;

    // Listen for PoolCreated events
    this.contract.on('PoolCreated', (poolId, staker, company, token, amount, event) => {
      this.addNotification({
        type: 'pool_created',
        title: 'New Pool Created',
        message: `Pool #${poolId.toString()} created with ${ethers.formatEther(amount)} ETH`,
        timestamp: Date.now(),
        data: { poolId: poolId.toString(), staker, company, amount: amount.toString() }
      });
    });

    // Listen for FundsStaked events
    this.contract.on('FundsStaked', (poolId, staker, token, amount, event) => {
      this.addNotification({
        type: 'funds_staked',
        title: 'Funds Staked',
        message: `${ethers.formatEther(amount)} ETH staked to Pool #${poolId.toString()}`,
        timestamp: Date.now(),
        data: { poolId: poolId.toString(), staker, amount: amount.toString() }
      });
    });

    // Listen for WhitelistAdded events
    this.contract.on('WhitelistAdded', (poolId, recipient, name, category, event) => {
      this.addNotification({
        type: 'whitelist_added',
        title: 'Whitelist Entry Added',
        message: `${name} (${category}) added to Pool #${poolId.toString()}`,
        timestamp: Date.now(),
        data: { poolId: poolId.toString(), recipient, name, category }
      });
    });

    // Listen for WhitelistApproved events
    this.contract.on('WhitelistApproved', (poolId, recipient, staker, event) => {
      this.addNotification({
        type: 'whitelist_approved',
        title: 'Whitelist Approved',
        message: `Recipient approved in Pool #${poolId.toString()}`,
        timestamp: Date.now(),
        data: { poolId: poolId.toString(), recipient, staker }
      });
    });

    // Listen for PaymentExecuted events
    this.contract.on('PaymentExecuted', (poolId, from, to, token, amount, purpose, event) => {
      this.addNotification({
        type: 'payment_executed',
        title: 'Payment Executed',
        message: `${ethers.formatEther(amount)} ETH paid from Pool #${poolId.toString()}`,
        timestamp: Date.now(),
        data: { poolId: poolId.toString(), from, to, amount: amount.toString(), purpose }
      });
    });

    // Listen for FundsReleased events
    this.contract.on('FundsReleased', (poolId, staker, token, amount, event) => {
      this.addNotification({
        type: 'funds_released',
        title: 'Funds Released',
        message: `${ethers.formatEther(amount)} ETH released from Pool #${poolId.toString()}`,
        timestamp: Date.now(),
        data: { poolId: poolId.toString(), staker, amount: amount.toString() }
      });
    });

    // Listen for PoolClosed events
    this.contract.on('PoolClosed', (poolId, staker, event) => {
      this.addNotification({
        type: 'pool_closed',
        title: 'Pool Closed',
        message: `Pool #${poolId.toString()} has been closed`,
        timestamp: Date.now(),
        data: { poolId: poolId.toString(), staker }
      });
    });
  }

  /**
   * Add a notification
   * @param {object} notification - Notification object
   */
  addNotification(notification) {
    const notif = {
      id: Date.now() + Math.random(),
      read: false,
      ...notification
    };

    this.notifications.unshift(notif);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Save to localStorage
    this.saveNotifications();

    // Notify listeners
    this.notifyListeners();

    // Show browser notification if permission granted
    this.showBrowserNotification(notif);
  }

  /**
   * Get all notifications
   * @returns {Array} Array of notifications
   */
  getNotifications() {
    return this.notifications;
  }

  /**
   * Get unread notifications
   * @returns {Array} Array of unread notifications
   */
  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark notification as read
   * @param {string} id - Notification ID
   */
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  /**
   * Subscribe to notification updates
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.notifications);
    });
  }

  /**
   * Save notifications to localStorage
   */
  saveNotifications() {
    try {
      localStorage.setItem('protocol_bank_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      // console.error('Error saving notifications:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  loadNotifications() {
    try {
      const saved = localStorage.getItem('protocol_bank_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
        this.notifyListeners();
      }
    } catch (error) {
      // console.error('Error loading notifications:', error);
    }
  }

  /**
   * Request browser notification permission
   */
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Show browser notification
   * @param {object} notification - Notification object
   */
  showBrowserNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: notification.id,
        requireInteraction: false
      });
    }
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
    this.listeners = [];
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Load saved notifications on initialization
if (typeof window !== 'undefined') {
  notificationService.loadNotifications();
}

export default notificationService;

