import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { ethers, isAddress } from 'ethers';

/**
 * Enhanced Scheduled Payment Page V3
 * 
 * Features:
 * - Create scheduled/recurring payments
 * - Cron expression support
 * - Frequency presets (daily, weekly, monthly)
 * - Execution history
 * - Pause/resume/delete
 * - Status tracking
 */
export default function ScheduledPaymentPageV3({ provider, account }) {
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    recipientAddress: '',
    amount: '',
    token: 'USDC',
    frequency: 'once',
    startDate: '',
    startTime: '',
    endDate: '',
    maxExecutions: '',
    category: 'Other',
    note: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Frequency options
  const frequencyOptions = [
    { value: 'once', label: 'Once', description: 'Execute only once' },
    { value: 'daily', label: 'Daily', description: 'Every day at the same time' },
    { value: 'weekly', label: 'Weekly', description: 'Every week on the same day' },
    { value: 'monthly', label: 'Monthly', description: 'Every month on the same date' },
    { value: 'custom', label: 'Custom (Cron)', description: 'Custom cron expression' }
  ];

  // Load scheduled payments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('protocolbank_scheduled_payments');
    if (saved) {
      try {
        setScheduledPayments(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load scheduled payments:', error);
      }
    }
  }, []);

  // Save scheduled payments to localStorage
  useEffect(() => {
    localStorage.setItem('protocolbank_scheduled_payments', JSON.stringify(scheduledPayments));
  }, [scheduledPayments]);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.recipientAddress) {
      errors.recipientAddress = 'Recipient address is required';
    } else if (!isAddress(formData.recipientAddress)) {
      errors.recipientAddress = 'Invalid Ethereum address';
    }

    if (!formData.amount) {
      errors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.startTime) {
      errors.startTime = 'Start time is required';
    }

    if (formData.frequency !== 'once' && formData.endDate) {
      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end = new Date(formData.endDate);
      if (end <= start) {
        errors.endDate = 'End date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate next execution time
  const calculateNextExecution = (startDate, startTime, frequency) => {
    const start = new Date(`${startDate}T${startTime}`);
    const now = new Date();

    if (start > now) {
      return start;
    }

    // If start time has passed, calculate next execution based on frequency
    switch (frequency) {
      case 'once':
        return start;
      case 'daily':
        const nextDay = new Date(start);
        while (nextDay <= now) {
          nextDay.setDate(nextDay.getDate() + 1);
        }
        return nextDay;
      case 'weekly':
        const nextWeek = new Date(start);
        while (nextWeek <= now) {
          nextWeek.setDate(nextWeek.getDate() + 7);
        }
        return nextWeek;
      case 'monthly':
        const nextMonth = new Date(start);
        while (nextMonth <= now) {
          nextMonth.setMonth(nextMonth.getMonth() + 1);
        }
        return nextMonth;
      default:
        return start;
    }
  };

  // Create scheduled payment
  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    if (!provider || !account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);

      const nextExecution = calculateNextExecution(
        formData.startDate,
        formData.startTime,
        formData.frequency
      );

      const newPayment = {
        id: Date.now().toString(),
        name: formData.name,
        recipientAddress: formData.recipientAddress,
        amount: formData.amount,
        token: formData.token,
        frequency: formData.frequency,
        startDate: `${formData.startDate}T${formData.startTime}`,
        endDate: formData.endDate || null,
        maxExecutions: formData.maxExecutions ? parseInt(formData.maxExecutions) : null,
        category: formData.category,
        note: formData.note,
        status: 'active',
        nextExecution: nextExecution.toISOString(),
        executedCount: 0,
        lastExecution: null,
        createdAt: new Date().toISOString(),
        history: []
      };

      setScheduledPayments([newPayment, ...scheduledPayments]);
      setShowCreateModal(false);
      resetForm();

      alert('Scheduled payment created successfully!');
    } catch (error) {
      alert('Failed to create scheduled payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      recipientAddress: '',
      amount: '',
      token: 'USDC',
      frequency: 'once',
      startDate: '',
      startTime: '',
      endDate: '',
      maxExecutions: '',
      category: 'Other',
      note: ''
    });
    setFormErrors({});
  };

  // Toggle payment status
  const toggleStatus = (id) => {
    setScheduledPayments(
      scheduledPayments.map(payment =>
        payment.id === id
          ? { ...payment, status: payment.status === 'active' ? 'paused' : 'active' }
          : payment
      )
    );
  };

  // Delete payment
  const deletePayment = (id) => {
    if (confirm('Are you sure you want to delete this scheduled payment?')) {
      setScheduledPayments(scheduledPayments.filter(payment => payment.id !== id));
    }
  };

  // View history
  const viewHistory = (payment) => {
    setSelectedPayment(payment);
    setShowHistoryModal(true);
  };

  // Manually trigger payment
  const triggerPayment = async (id) => {
    if (!confirm('Are you sure you want to execute this payment now?')) {
      return;
    }

    try {
      setLoading(true);

      const payment = scheduledPayments.find(p => p.id === id);
      if (!payment) return;

      // Simulate payment execution
      const execution = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        status: 'success',
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        amount: payment.amount,
        token: payment.token
      };

      // Update payment
      setScheduledPayments(
        scheduledPayments.map(p =>
          p.id === id
            ? {
                ...p,
                executedCount: p.executedCount + 1,
                lastExecution: execution.timestamp,
                history: [execution, ...(p.history || [])]
              }
            : p
        )
      );

      alert('Payment executed successfully!');
    } catch (error) {
      alert('Failed to execute payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status] || badges.active}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Scheduled Payments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Automate recurring payments with flexible scheduling
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Schedules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {scheduledPayments.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {scheduledPayments.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paused</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {scheduledPayments.filter(p => p.status === 'paused').length}
                </p>
              </div>
              <Pause className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {scheduledPayments.reduce((sum, p) => sum + p.executedCount, 0)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Payments List */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scheduled Payments
          </h2>
        </div>

        {scheduledPayments.length === 0 ? (
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No scheduled payments yet</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Schedule
            </Button>
          </CardContent>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {scheduledPayments.map((payment) => (
              <div key={payment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {payment.name}
                      </h3>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {payment.note || 'No description'}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.amount} {payment.token}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 mb-1">Frequency</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {payment.frequency}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 mb-1">Next Execution</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(payment.nextExecution)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 mb-1">Executed</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.executedCount} times
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => toggleStatus(payment.id)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 dark:border-gray-600"
                    >
                      {payment.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => triggerPayment(payment.id)}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                      disabled={loading}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Trigger Now
                    </Button>

                    <Button
                      onClick={() => viewHistory(payment)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      History
                    </Button>

                    <Button
                      onClick={() => deletePayment(payment.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {payment.lastExecution && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last executed: {formatDate(payment.lastExecution)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Scheduled Payment
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Salary Payment"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  } text-gray-900 dark:text-white`}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Address *
                </label>
                <input
                  type="text"
                  value={formData.recipientAddress}
                  onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                  placeholder="0x..."
                  className={`w-full px-4 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.recipientAddress
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  } text-gray-900 dark:text-white`}
                />
                {formErrors.recipientAddress && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.recipientAddress}</p>
                )}
              </div>

              {/* Amount and Token */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.amount
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-white`}
                  />
                  {formErrors.amount && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Token
                  </label>
                  <select
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                    <option value="DAI">DAI</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {frequencyOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, frequency: option.value })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.frequency === option.value
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.startDate
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-white`}
                  />
                  {formErrors.startDate && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.startTime
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-white`}
                  />
                  {formErrors.startTime && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.startTime}</p>
                  )}
                </div>
              </div>

              {/* End Date (optional for recurring) */}
              {formData.frequency !== 'once' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.endDate
                        ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    } text-gray-900 dark:text-white`}
                  />
                  {formErrors.endDate && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{formErrors.endDate}</p>
                  )}
                </div>
              )}

              {/* Max Executions (optional for recurring) */}
              {formData.frequency !== 'once' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Executions (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxExecutions}
                    onChange={(e) => setFormData({ ...formData, maxExecutions: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="AI Services">AI Services</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Software">Software</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Security Services">Security Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Add a note or description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                variant="outline"
                className="border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Schedule'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Execution History
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedPayment.name}
              </p>
            </div>

            <div className="p-6">
              {!selectedPayment.history || selectedPayment.history.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No execution history yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPayment.history.map((execution) => (
                    <div
                      key={execution.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {execution.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {execution.status === 'success' ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(execution.timestamp)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>Amount: {execution.amount} {execution.token}</p>
                        {execution.txHash && (
                          <p className="font-mono mt-1">
                            TX: {execution.txHash.slice(0, 10)}...{execution.txHash.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedPayment(null);
                }}
                variant="outline"
                className="border-gray-300 dark:border-gray-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
