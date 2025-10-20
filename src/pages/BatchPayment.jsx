import { useState, useRef } from 'react';
import { Upload, Download, Plus, Trash2, Check, X, AlertCircle, Loader, Send } from 'lucide-react';

export default function BatchPayment() {
  const [recipients, setRecipients] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // 下载 CSV 模板
  const downloadTemplate = () => {
    const template = `address,amount,category,note
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,1.5,Technology,Supplier Payment
0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed,2.3,Marketing,Marketing Service
0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199,0.5,Consulting,Consulting Fee`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_payment_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 手动添加收款人
  const addRecipient = () => {
    setRecipients(prev => [...prev, {
      id: Date.now(),
      address: '',
      amount: '',
      note: '',
      category: '',
      status: 'pending'
    }]);
  };

  // 更新收款人信息
  const updateRecipient = (id, field, value) => {
    setRecipients(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  // 删除收款人
  const removeRecipient = (id) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  // 计算总金额
  const calculateTotal = () => {
    return recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  // 清空所有收款人
  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all recipients?')) {
      setRecipients([]);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* 头部 */}
      <div className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900 dark:text-white">
                Batch Payment
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Send payments to multiple recipients at once
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* 下载模板 */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>

              {/* 上传 CSV */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Recipients</p>
            <p className="text-2xl font-light text-gray-900 dark:text-white mt-1">
              {recipients.length}
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Total Amount</p>
            <p className="text-2xl font-light text-gray-900 dark:text-white mt-1 font-mono">
              {calculateTotal().toFixed(4)} <span className="text-sm">ETH</span>
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Status</p>
            <p className="text-2xl font-light text-gray-900 dark:text-white mt-1">
              Ready
            </p>
          </div>

          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Network</p>
            <p className="text-2xl font-light text-gray-900 dark:text-white mt-1">
              Ethereum
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={addRecipient}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Recipient
          </button>

          <button
            onClick={clearAll}
            disabled={recipients.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>

          <div className="flex-1"></div>

          <button
            disabled={recipients.length === 0 || processing}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Execute Batch Payment
              </>
            )}
          </button>
        </div>

        {/* 收款人列表 */}
        {recipients.length === 0 ? (
          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg p-12 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No recipients added yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Upload a CSV file or manually add recipients to get started
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload CSV
              </button>
              <button
                onClick={addRecipient}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Add Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-black border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount (ETH)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recipients.map((recipient, index) => (
                    <tr key={recipient.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={recipient.address}
                          onChange={(e) => updateRecipient(recipient.id, 'address', e.target.value)}
                          disabled={processing || recipient.status === 'success'}
                          placeholder="0x..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-white font-mono disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.0001"
                          value={recipient.amount}
                          onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                          disabled={processing || recipient.status === 'success'}
                          placeholder="0.0"
                          className="w-full px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-white font-mono disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={recipient.category}
                          onChange={(e) => updateRecipient(recipient.id, 'category', e.target.value)}
                          disabled={processing || recipient.status === 'success'}
                          className="w-full px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-white disabled:opacity-50"
                        >
                          <option value="">Select...</option>
                          <option value="Technology">Technology</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Consulting">Consulting</option>
                          <option value="Cloud Services">Cloud Services</option>
                          <option value="Logistics">Logistics</option>
                          <option value="Design">Design</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={recipient.note}
                          onChange={(e) => updateRecipient(recipient.id, 'note', e.target.value)}
                          disabled={processing || recipient.status === 'success'}
                          placeholder="Optional note"
                          className="w-full px-3 py-1.5 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded text-sm text-gray-900 dark:text-white disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusIcon(recipient.status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeRecipient(recipient.id)}
                          disabled={processing || recipient.status === 'processing'}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

