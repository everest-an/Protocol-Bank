import { useState } from 'react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Upload, X, Plus, Send, Download, AlertCircle, Layers } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

export default function BatchPaymentPage() {
  const [payments, setPayments] = useState([]);
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

  const removePayment = (id) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const updatePayment = (id, field, value) => {
    setPayments(
      payments.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  };

  const handleBatchSubmit = async () => {
    if (payments.length === 0) {
      alert('请至少添加一笔支付');
      return;
    }

    const invalid = payments.find(p => !p.to || !p.amount || !p.category);
    if (invalid) {
      alert('请填写所有支付信息');
      return;
    }

    try {
      setLoading(true);
      // TODO: 调用智能合约批量支付
      alert(`成功提交 ${payments.length} 笔支付`);
      setPayments([]);
    } catch (error) {
      alert('批量支付失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const importCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result;
      const lines = csv.split('\n');
      const imported = [];

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
      alert(`导入 ${imported.length} 笔支付`);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-normal text-gray-900 dark:text-gray-100 mb-1">批量支付</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">一次性创建多笔支付,支持CSV导入</p>
      </div>

      {/* Toolbar */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={addPayment}
                className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900"
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
                <div className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center text-sm font-medium">
                  <Upload className="w-4 h-4 mr-2" />
                  导入CSV
                </div>
              </label>

              <Button
                onClick={exportTemplate}
                variant="outline"
                className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4 mr-2" />
                下载模板
              </Button>
            </div>

            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
            >
              {Object.entries(currencies).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.symbol} {code}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-400" />
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
              支付列表 ({payments.length})
            </h2>
          </div>
        </div>

        {payments.length === 0 ? (
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">还没有添加支付</p>
            <Button
              onClick={addPayment}
              className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加第一笔支付
            </Button>
          </CardContent>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {payments.map((payment, index) => (
              <div key={payment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium text-sm">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">收款地址</label>
                      <input
                        type="text"
                        value={payment.to}
                        onChange={(e) => updatePayment(payment.id, 'to', e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">金额</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={payment.amount}
                          onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                        />
                        <select
                          value={payment.currency}
                          onChange={(e) => updatePayment(payment.id, 'currency', e.target.value)}
                          className="px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
                        >
                          {Object.keys(currencies).map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                      </div>
                      {payment.currency !== 'ETH' && payment.amount && (
                        <p className="text-xs text-gray-400 mt-1">
                          ≈ {fiatToEth(payment.amount, payment.currency).toFixed(4)} ETH
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">类别</label>
                      <select
                        value={payment.category}
                        onChange={(e) => updatePayment(payment.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 text-sm"
                      >
                        <option value="">选择类别</option>
                        <option value="Technical Services">Technical Services</option>
                        <option value="Cloud Computing">Cloud Computing</option>
                        <option value="Raw Materials">Raw Materials</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Consulting Services">Consulting Services</option>
                        <option value="Design Services">Design Services</option>
                        <option value="Marketing">Marketing</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={() => removePayment(payment.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 w-full"
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
      </Card>

      {/* Summary and Submit */}
      {payments.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">批量支付总计</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  共 {payments.length} 笔支付
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-light text-gray-900 dark:text-gray-100">
                  {totalEth.toFixed(4)} ETH
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatEthWithFiat(totalEth.toString()).fiat}
                </p>
              </div>
            </div>

            <Button
              onClick={handleBatchSubmit}
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium py-3"
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

