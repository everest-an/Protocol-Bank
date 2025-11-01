import { useState, useEffect } from 'react';
import { Calendar, Clock, Repeat, Plus, Edit2, Trash2, Pause, Play, Check, X, AlertCircle, Loader } from 'lucide-react';
import {
  createScheduledPayment,
  getScheduledPaymentsList,
  pauseScheduledPayment,
  resumeScheduledPayment,
  cancelScheduledPayment,
} from '../services/scheduledPaymentService';
import { useWeb3 } from '../hooks/useWeb3';

export default function ScheduledPayment() {
  const { account } = useWeb3();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    to_account_id: '',
    amount: '',
    schedule_type: 'once',
    schedule_time: '',
    max_executions: '',
    note: '',
    category: ''
  });

  // 加载定时支付列表
  useEffect(() => {
    if (account) {
      loadSchedules();
    }
  }, [account]);

  const loadSchedules = async () => {
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getScheduledPaymentsList(account);
      setSchedules(result.data.scheduled_payments);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setError('Failed to load scheduled payments');
    } finally {
      setLoading(false);
    }
  };

  // 创建新的定时支付
  const createSchedule = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    // 验证输入
    if (!newSchedule.to_account_id || !newSchedule.amount || !newSchedule.schedule_time) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        from_account_id: account,
        to_account_id: newSchedule.to_account_id,
        amount: parseFloat(newSchedule.amount),
        schedule_type: newSchedule.schedule_type,
        schedule_time: new Date(newSchedule.schedule_time).toISOString(),
        max_executions: newSchedule.max_executions ? parseInt(newSchedule.max_executions) : null,
      };

      await createScheduledPayment(paymentData);
      
      setShowCreateModal(false);
      resetForm();
      await loadSchedules();
      
      alert('Scheduled payment created successfully!');
    } catch (error) {
      console.error('Error creating schedule:', error);
      setError(error.message || 'Failed to create scheduled payment');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setNewSchedule({
      to_account_id: '',
      amount: '',
      schedule_type: 'once',
      schedule_time: '',
      max_executions: '',
      note: '',
      category: ''
    });
  };

  // 暂停定时支付
  const handlePause = async (scheduleId) => {
    try {
      await pauseScheduledPayment(scheduleId);
      await loadSchedules();
      alert('Scheduled payment paused');
    } catch (error) {
      console.error('Error pausing schedule:', error);
      alert('Failed to pause scheduled payment');
    }
  };

  // 恢复定时支付
  const handleResume = async (scheduleId) => {
    try {
      await resumeScheduledPayment(scheduleId);
      await loadSchedules();
      alert('Scheduled payment resumed');
    } catch (error) {
      console.error('Error resuming schedule:', error);
      alert('Failed to resume scheduled payment');
    }
  };

  // 取消定时支付
  const handleCancel = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled payment?')) {
      return;
    }

    try {
      await cancelScheduledPayment(scheduleId);
      await loadSchedules();
      alert('Scheduled payment cancelled');
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      alert('Failed to cancel scheduled payment');
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // 获取频率标签
  const getFrequencyLabel = (type) => {
    const labels = {
      once: 'One Time',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    };
    return labels[type] || type;
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduled Payments</h1>
          <p className="text-gray-600">Automate recurring payments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!account}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Create Schedule
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Schedules List */}
      {!loading && schedules.length > 0 && (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.schedule_id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      ${parseFloat(schedule.amount).toFixed(2)}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                      {schedule.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getFrequencyLabel(schedule.schedule_type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    To: {schedule.to_account_id.slice(0, 10)}...{schedule.to_account_id.slice(-8)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Next: {formatDate(schedule.next_execution_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat className="w-4 h-4" />
                      Executed: {schedule.execution_count} times
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {schedule.status === 'active' && (
                    <button
                      onClick={() => handlePause(schedule.schedule_id)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Pause"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {schedule.status === 'paused' && (
                    <button
                      onClick={() => handleResume(schedule.schedule_id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Resume"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {(schedule.status === 'active' || schedule.status === 'paused') && (
                    <button
                      onClick={() => handleCancel(schedule.schedule_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {schedule.last_executed_at && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Last executed: {formatDate(schedule.last_executed_at)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && schedules.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scheduled Payments</h3>
          <p className="text-gray-600 mb-6">
            Create your first scheduled payment to automate recurring transactions
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!account}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Schedule
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Scheduled Payment</h2>

              <div className="space-y-4">
                {/* Recipient */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Account ID *
                  </label>
                  <input
                    type="text"
                    value={newSchedule.to_account_id}
                    onChange={(e) => setNewSchedule({ ...newSchedule, to_account_id: e.target.value })}
                    placeholder="Account ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (USD) *
                  </label>
                  <input
                    type="number"
                    value={newSchedule.amount}
                    onChange={(e) => setNewSchedule({ ...newSchedule, amount: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Schedule Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency *
                  </label>
                  <select
                    value={newSchedule.schedule_type}
                    onChange={(e) => setNewSchedule({ ...newSchedule, schedule_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="once">One Time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Schedule Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={newSchedule.schedule_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, schedule_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Max Executions */}
                {newSchedule.schedule_type !== 'once' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Executions (Optional)
                    </label>
                    <input
                      type="number"
                      value={newSchedule.max_executions}
                      onChange={(e) => setNewSchedule({ ...newSchedule, max_executions: e.target.value })}
                      placeholder="Leave empty for unlimited"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createSchedule}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
