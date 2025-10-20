import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Repeat, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

interface ScheduledPayment {
  id: string;
  to: string;
  amount: string;
  currency: string;
  category: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'completed';
  nextExecution?: Date;
}

export default function ScheduledPayment() {
  const [payments, setPayments] = useState<ScheduledPayment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { selectedCurrency, currencies, formatEthWithFiat } = useCurrency();

  const [formData, setFormData] = useState({
    to: '',
    amount: '',
    currency: selectedCurrency,
    category: '',
    frequency: 'monthly' as const,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.to || !formData.amount || !formData.category) {
      toast.error('请填写所有必填字段');
      return;
    }

    const newPayment: ScheduledPayment = {
      id: Date.now().toString(),
      ...formData,
      status: 'active',
      nextExecution: new Date(formData.startDate),
    };

    setPayments([...payments, newPayment]);
    setShowForm(false);
    setFormData({
      to: '',
      amount: '',
      currency: selectedCurrency,
      category: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });

    toast.success('定时支付已创建');
  };

  const toggleStatus = (id: string) => {
    setPayments(
      payments.map(p =>
        p.id === id
          ? { ...p, status: p.status === 'active' ? 'paused' : 'active' }
          : p
      )
    );
  };

  const deletePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
    toast.success('定时支付已删除');
  };

  const getFrequencyText = (frequency: string) => {
    const map = {
      once: '一次性',
      daily: '每日',
      weekly: '每周',
      monthly: '每月',
    };
    return map[frequency as keyof typeof map] || frequency;
  };

  const getStatusColor = (status: string) => {
    const map = {
      active: 'text-green-400 bg-green-500/20',
      paused: 'text-yellow-400 bg-yellow-500/20',
      completed: 'text-gray-400 bg-gray-500/20',
    };
    return map[status as keyof typeof map] || '';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            定时支付
          </h1>
          <p className="text-gray-400 mt-2">设置自动定期支付,支持每日/每周/每月</p>
        </div>

        {/* 创建按钮 */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-gradient-to-r from-cyan-500 to-green-500"
          >
            <Calendar className="w-4 h-4 mr-2" />
            创建定时支付
          </Button>
        )}

        {/* 创建表单 */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">新建定时支付</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">收款地址 *</label>
                  <input
                    type="text"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">金额 *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    />
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      {Object.keys(currencies).map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">类别 *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="">选择类别</option>
                    <option value="技术服务">技术服务</option>
                    <option value="云计算">云计算</option>
                    <option value="原材料">原材料</option>
                    <option value="物流运输">物流运输</option>
                    <option value="咨询服务">咨询服务</option>
                    <option value="设计服务">设计服务</option>
                    <option value="营销推广">营销推广</option>
                    <option value="其他">其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">频率 *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="once">一次性</option>
                    <option value="daily">每日</option>
                    <option value="weekly">每周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">开始日期 *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">结束日期 (可选)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1 border-gray-700"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-green-500"
                >
                  创建
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 定时支付列表 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-bold">定时支付列表 ({payments.length})</h2>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">还没有定时支付</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(payment.status)}`}>
                          {payment.status === 'active' ? '运行中' : payment.status === 'paused' ? '已暂停' : '已完成'}
                        </span>
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs font-semibold flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          {getFrequencyText(payment.frequency)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">收款地址</div>
                          <div className="text-white font-mono">
                            {payment.to.slice(0, 6)}...{payment.to.slice(-4)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">金额</div>
                          <div className="text-white font-semibold">
                            {payment.amount} {payment.currency}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">类别</div>
                          <div className="text-white">{payment.category}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">下次执行</div>
                          <div className="text-white">
                            {payment.nextExecution?.toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => toggleStatus(payment.id)}
                        variant="outline"
                        size="sm"
                        className={
                          payment.status === 'active'
                            ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/10'
                            : 'border-green-500 text-green-400 hover:bg-green-500/10'
                        }
                      >
                        {payment.status === 'active' ? (
                          <><Pause className="w-4 h-4 mr-1" /> 暂停</>
                        ) : (
                          <><Play className="w-4 h-4 mr-1" /> 恢复</>
                        )}
                      </Button>
                      <Button
                        onClick={() => deletePayment(payment.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

