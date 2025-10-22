import { useState } from 'react';
import { Calendar, Clock, Repeat, Plus, Edit2, Trash2, Pause, Play, Check, X, AlertCircle } from 'lucide-react';

export default function ScheduledPayment() {
  const [schedules, setSchedules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    recipient: '',
    amount: '',
    startDate: '',
    startTime: '',
    frequency: 'once',
    endDate: '',
    occurrences: '',
    note: '',
    category: ''
  });

  // 添加新的定时支付
  const createSchedule = () => {
    const schedule = {
      id: Date.now(),
      ...newSchedule,
      status: 'active',
      nextPayment: `${newSchedule.startDate} ${newSchedule.startTime}`,
      executedCount: 0,
      createdAt: new Date().toISOString()
    };
    setSchedules(prev => [schedule, ...prev]);
    setShowCreateModal(false);
    resetForm();
  };

  // 重置表单
  const resetForm = () => {
    setNewSchedule({
      recipient: '',
      amount: '',
      startDate: '',
      startTime: '',
      frequency: 'once',
      endDate: '',
      occurrences: '',
      note: '',
      category: ''
    });
  };

  // 切换暂停/恢复
  const togglePause = (id) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
    ));
  };

  // 删除定时支付
  const deleteSchedule = (id) => {
    if (window.confirm('Are you sure you want to delete this scheduled payment?')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  // 获取频率显示文本
  const getFrequencyText = (frequency) => {
    const map = {
      'once': 'One-time',
      'daily': 'Daily',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'custom': 'Custom'
    };
    return map[frequency] || frequency;
  };

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // 计算统计数据
  const stats = {
    total: schedules.length,
    active: schedules.filter(s => s.status === 'active').length,
    paused: schedules.filter(s => s.status === 'paused').length,
    totalAmount: schedules.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* 头部 */}
      <div className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900 dark:text-white">
                Scheduled Payments
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Automate recurring payments and schedule future transactions
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Schedule
            </button>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Total Schedules</p>
            <p className="text-2xl font-light text-gray-900 dark:text-white mt-1">
              {stats.total}
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Active</p>
            <p className="text-2xl font-light text-green-600 mt-1">
              {stats.active}
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Paused</p>
            <p className="text-2xl font-light text-yellow-600 mt-1">
              {stats.paused}
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Total Amount</p>
            <p className="text-2xl font-light text-gray-900 dark:text-white mt-1 font-mono">
              {stats.totalAmount.toFixed(4)} <span className="text-sm">ETH</span>
            </p>
          </div>
        </div>

        {/* 定时支付列表 */}
        {schedules.length === 0 ? (
          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No scheduled payments yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Create your first scheduled payment to automate recurring transactions
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map(schedule => (
              <div
                key={schedule.id}
                className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-6 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(schedule.status)}
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {schedule.note || 'Scheduled Payment'}
                      </h3>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 rounded">
                        {getFrequencyText(schedule.frequency)}
                      </span>
                      {schedule.category && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-xs text-blue-700 dark:text-blue-300 rounded">
                          {schedule.category}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Recipient</p>
                        <p className="text-gray-900 dark:text-white font-mono mt-1">
                          {schedule.recipient.slice(0, 10)}...{schedule.recipient.slice(-8)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="text-gray-900 dark:text-white font-mono mt-1">
                          {schedule.amount} ETH
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Next Payment</p>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {schedule.nextPayment}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Executed</p>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {schedule.executedCount} times
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => togglePause(schedule.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      title={schedule.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {schedule.status === 'active' ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => deleteSchedule(schedule.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建定时支付模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                Create Scheduled Payment
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Set up a new scheduled or recurring payment
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* 收款人地址 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Address *
                </label>
                <input
                  type="text"
                  value={newSchedule.recipient}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                />
              </div>

              {/* Amount和Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (ETH) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newSchedule.amount}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.0"
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newSchedule.category}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">Select...</option>
                    <option value="Salary">Salary</option>
                    <option value="Rent">Rent</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* 开始日期和时间 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newSchedule.startDate}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* 频率 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency *
                </label>
                <select
                  value={newSchedule.frequency}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="once">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* 结束条件（仅循环支付） */}
              {newSchedule.frequency !== 'once' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={newSchedule.endDate}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Or Number of Occurrences
                    </label>
                    <input
                      type="number"
                      value={newSchedule.occurrences}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, occurrences: e.target.value }))}
                      placeholder="Leave empty for unlimited"
                      className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Note
                </label>
                <textarea
                  value={newSchedule.note}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note for this payment..."
                  rows="3"
                  className="w-full px-3 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createSchedule}
                disabled={!newSchedule.recipient || !newSchedule.amount || !newSchedule.startDate || !newSchedule.startTime}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

