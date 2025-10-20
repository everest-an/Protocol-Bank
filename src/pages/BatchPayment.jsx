import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Plus, Send, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

interface PaymentItem {
  id: string;
  to: string;
  amount: string;
  category: string;
  currency: string;
}

export default function BatchPayment() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedCurrency, setSelectedCurrency, currencies, fiatToEth, formatEthWithFiat } = useCurrency();

  const addPayment = () => {
    setPayments([
      ...payments,
      {
        id: Date.now().toString(),
        to: '',
        amount: '',
        category: '',
        currency: selectedCurrency,
      },
    ]);
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const updatePayment = (id: string, field: keyof PaymentItem, value: string) => {
    setPayments(
      payments.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const handleBatchSubmit = async () => {
    if (payments.length === 0) {
      toast.error('请至少添加一笔支付');
      return;
    }

    const invalid = payments.find(p => !p.to || !p.amount || !p.category);
    if (invalid) {
      toast.error('请填写所有支付信息');
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用智能合约批量支付
      toast.success(`成功提交 ${payments.length} 笔支付`);
      setPayments([]);
    } catch (error: any) {
      toast.error('批量支付失败', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const imported: PaymentItem[] = [];

      lines.slice(1).forEach((line, index) => {
        const [to, amount, category, currency] = line.split(',');
        if (to && amount) {
          imported.push({
            id: `imported-${index}`,
            to: to.trim(),
            amount: amount.trim(),
            category: category?.trim() || '其他',
            currency: currency?.trim() || 'USD',
          });
        }
      });

      setPayments([...payments, ...imported]);
      toast.success(`导入 ${imported.length} 笔支付`);
    };

    reader.readAsText(file);
  };

  const exportTemplate = () => {
    const csv = 'Address,Amount,Category,Currency\n0x...,1.5,Technology,USD\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-payment-template.csv';
    a.click();
  };

  const totalEth = payments.reduce((sum, p) => {
    if (p.currency === 'ETH') {
      return sum + parseFloat(p.amount || '0');
    } else {
      return sum + fiatToEth(p.amount || '0', p.currency);
    }
  }, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
            批量支付
          </h1>
          <p className="text-gray-400 mt-2">一次性创建多笔支付,支持CSV导入</p>
        </div>

        {/* 工具栏 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={addPayment}
                className="bg-gradient-to-r from-cyan-500 to-green-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加支付
              </Button>
              
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={importCSV}
                  className="hidden"
                />
                <div className="px-4 py-2 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-colors flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  导入CSV
                </div>
              </label>

              <Button
                onClick={exportTemplate}
                variant="outline"
                className="border-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                下载模板
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                {Object.entries(currencies).map(([code, config]) => (
                  <option key={code} value={code}>
                    {config.symbol} {code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 支付列表 */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-bold">支付列表 ({payments.length})</h2>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">还没有添加支付</p>
              <Button
                onClick={addPayment}
                className="mt-4 bg-gradient-to-r from-cyan-500 to-green-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加第一笔支付
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {payments.map((payment, index) => (
                <div key={payment.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 font-semibold">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">收款地址</label>
                        <input
                          type="text"
                          value={payment.to}
                          onChange={(e) => updatePayment(payment.id, 'to', e.target.value)}
                          placeholder="0x..."
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">金额</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.0001"
                            value={payment.amount}
                            onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                          />
                          <select
                            value={payment.currency}
                            onChange={(e) => updatePayment(payment.id, 'currency', e.target.value)}
                            className="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                          >
                            {Object.keys(currencies).map(code => (
                              <option key={code} value={code}>{code}</option>
                            ))}
                          </select>
                        </div>
                        {payment.currency !== 'ETH' && payment.amount && (
                          <p className="text-xs text-gray-500 mt-1">
                            ≈ {fiatToEth(payment.amount, payment.currency).toFixed(4)} ETH
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-400 mb-1">类别</label>
                        <select
                          value={payment.category}
                          onChange={(e) => updatePayment(payment.id, 'category', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
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

                      <div className="flex items-end">
                        <Button
                          onClick={() => removePayment(payment.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-400 hover:bg-red-500/10 w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          移除
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 总计和提交 */}
        {payments.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-500/20 to-green-500/20 border border-cyan-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">批量支付总计</h3>
                <p className="text-sm text-gray-300 mt-1">
                  共 {payments.length} 笔支付
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-cyan-400">
                  {totalEth.toFixed(4)} ETH
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  {formatEthWithFiat(totalEth.toString()).fiat}
                </p>
              </div>
            </div>

            <Button
              onClick={handleBatchSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-green-500 text-white font-semibold py-3"
            >
              {loading ? (
                <>处理中...</>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  提交批量支付
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

