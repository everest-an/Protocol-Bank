import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * 创建批量支付
 */
export const createBatchPayment = async (fromAccountId, recipients) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/batch-payment/create`, {
      from_account_id: fromAccountId,
      recipients: recipients,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating batch payment:', error);
    throw error.response?.data || error;
  }
};

/**
 * 上传 CSV 文件创建批量支付
 */
export const uploadBatchPaymentCSV = async (fromAccountId, file) => {
  try {
    const formData = new FormData();
    formData.append('from_account_id', fromAccountId);
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/batch-payment/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading batch payment CSV:', error);
    throw error.response?.data || error;
  }
};

/**
 * 获取批量支付状态
 */
export const getBatchPaymentStatus = async (batchId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/batch-payment/${batchId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting batch payment status:', error);
    throw error.response?.data || error;
  }
};

/**
 * 获取批量支付历史
 */
export const getBatchPaymentHistory = async (accountId, limit = 50, offset = 0) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/batch-payment/history/${accountId}`, {
      params: { limit, offset },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting batch payment history:', error);
    throw error.response?.data || error;
  }
};

/**
 * 轮询批量支付状态直到完成
 */
export const pollBatchPaymentStatus = async (batchId, onUpdate, maxAttempts = 60, interval = 2000) => {
  let attempts = 0;

  const poll = async () => {
    try {
      const result = await getBatchPaymentStatus(batchId);
      
      if (onUpdate) {
        onUpdate(result.data);
      }

      const status = result.data.batch_status;
      
      // 如果状态是终态，停止轮询
      if (status === 'completed' || status === 'failed' || status === 'partially_completed') {
        return result.data;
      }

      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Polling timeout');
      }

      // 继续轮询
      await new Promise(resolve => setTimeout(resolve, interval));
      return poll();
    } catch (error) {
      console.error('Error polling batch payment status:', error);
      throw error;
    }
  };

  return poll();
};
