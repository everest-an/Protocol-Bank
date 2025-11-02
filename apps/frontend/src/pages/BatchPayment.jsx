import { useState, useRef } from 'react';
import { Upload, Download, Plus, Trash2, Check, X, AlertCircle, Loader, Send, RefreshCw } from 'lucide-react';
import { createBatchPayment, uploadBatchPaymentCSV, pollBatchPaymentStatus } from '../services/batchPaymentService';
import { useWeb3 } from '../hooks/useWeb3';

export default function BatchPayment() {
  const { account } = useWeb3();
  const [recipients, setRecipients] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [error, setError] = useState(null);
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

  // 手动添加Recipient
  const addRecipient = () => {
    setRecipients(prev => [...prev, {
      id: Date.now(),
      to_address: '',
      amount: '',
      note: '',
      category: '',
      status: 'pending'
    }]);
  };

  // 更新Recipient信息
  const updateRecipient = (id, field, value) => {
    setRecipients(prev => prev.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  // 删除Recipient
  const removeRecipient = (id) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  // 计算总Amount
  const calculateTotal = () => {
    return recipients.reduce((sum, r) => {
      const amount = parseFloat(r.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  // 清空所有Recipient
  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all recipients?')) {
      setRecipients([]);
      setBatchId(null);
      setBatchStatus(null);
      setError(null);
    }
  };

  // 验证以太坊地址
  const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // 处理 CSV 文件上传
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 使用后端 API 上传 CSV
      const result = await uploadBatchPaymentCSV(account, file);
      
      setBatchId(result.data.batch_id);
      setProcessing(true);

      // 轮询批量支付状态
      await pollBatchPaymentStatus(result.data.batch_id, (status) => {
        setBatchStatus(status);
      });

      setProcessing(false);
      alert('Batch payment completed successfully!');
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setError(error.message || 'Failed to upload CSV file');
      setProcessing(false);
    } finally {
      setUploading(false);
    }
  };

  // 执行批量支付
  const executeBatchPayment = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    // 验证所有Recipients
    const errors = [];
    recipients.forEach((r, index) => {
      if (!isValidAddress(r.to_address)) {
        errors.push(`Recipient ${index + 1}: Invalid address`);
      }
      const amount = parseFloat(r.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Recipient ${index + 1}: Invalid amount`);
      }
    });

    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    if (recipients.length === 0) {
      alert('Please add at least one recipient');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // 准备数据
      const recipientsData = recipients.map(r => ({
        to_address: r.to_address,
        amount: parseFloat(r.amount),
        category: r.category || '',
        note: r.note || '',
      }));

      // 调用后端 API
      const result = await createBatchPayment(account, recipientsData);
      
      setBatchId(result.data.batch_id);

      // 轮询批量支付状态
      await pollBatchPaymentStatus(result.data.batch_id, (status) => {
        setBatchStatus(status);
        
        // 更新前端显示的状态
        setRecipients(prev => prev.map((r, index) => {
          const tx = status.transactions?.[index];
          return {
            ...r,
            status: tx?.status || 'pending',
            transaction_id: tx?.transaction_id,
          };
        }));
      });

      setProcessing(false);
      alert('Batch payment completed successfully!');
    } catch (error) {
      console.error('Error executing batch payment:', error);
      setError(error.message || 'Failed to execute batch payment');
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Payment</h1>
        <p className="text-gray-600">Send payments to multiple recipients at once</p>
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

      {/* Batch Status Display */}
      {batchStatus && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900">Batch Payment Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              batchStatus.batch_status === 'completed' ? 'bg-green-100 text-green-800' :
              batchStatus.batch_status === 'failed' ? 'bg-red-100 text-red-800' :
              batchStatus.batch_status === 'partially_completed' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {batchStatus.batch_status}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Recipients</p>
              <p className="font-semibold text-gray-900">{batchStatus.total_recipients}</p>
            </div>
            <div>
              <p className="text-gray-600">Completed</p>
              <p className="font-semibold text-green-600">{batchStatus.completed_count}</p>
            </div>
            <div>
              <p className="text-gray-600">Pending</p>
              <p className="font-semibold text-blue-600">{batchStatus.pending_count}</p>
            </div>
            <div>
              <p className="text-gray-600">Failed</p>
              <p className="font-semibold text-red-600">{batchStatus.failed_count}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || processing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload CSV
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={addRecipient}
          disabled={processing}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Add Recipient
        </button>

        {recipients.length > 0 && (
          <>
            <button
              onClick={clearAll}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>

            <button
              onClick={executeBatchPayment}
              disabled={processing || recipients.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
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
          </>
        )}
      </div>

      {/* Recipients Table */}
      {recipients.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (USD)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipients.map((recipient, index) => (
                  <tr key={recipient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={recipient.to_address}
                        onChange={(e) => updateRecipient(recipient.id, 'to_address', e.target.value)}
                        placeholder="0x..."
                        disabled={processing}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={recipient.amount}
                        onChange={(e) => updateRecipient(recipient.id, 'amount', e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={processing}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={recipient.category}
                        onChange={(e) => updateRecipient(recipient.id, 'category', e.target.value)}
                        placeholder="Category"
                        disabled={processing}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={recipient.note}
                        onChange={(e) => updateRecipient(recipient.id, 'note', e.target.value)}
                        placeholder="Note"
                        disabled={processing}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        recipient.status === 'completed' ? 'bg-green-100 text-green-800' :
                        recipient.status === 'failed' ? 'bg-red-100 text-red-800' :
                        recipient.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {recipient.status === 'completed' && <Check className="w-3 h-3" />}
                        {recipient.status === 'failed' && <X className="w-3 h-3" />}
                        {recipient.status === 'processing' && <Loader className="w-3 h-3 animate-spin" />}
                        {recipient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeRecipient(recipient.id)}
                        disabled={processing}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan="2" className="px-4 py-3 text-sm font-semibold text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    ${calculateTotal().toFixed(2)}
                  </td>
                  <td colSpan="4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {recipients.length === 0 && !batchStatus && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recipients Added</h3>
          <p className="text-gray-600 mb-6">
            Upload a CSV file or manually add recipients to get started
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload CSV
            </button>
            <button
              onClick={addRecipient}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
