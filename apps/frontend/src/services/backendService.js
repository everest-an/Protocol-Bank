import authUtils from '../utils/auth';

const API_BASE_URL = 'https://protocolbanks.com/api/v1';

// Helper function to make authenticated API calls
const apiCall = async (endpoint, options = {}) => {
  const token = authUtils.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
};

// 交易服务
export const transactionService = {
  // 创建转账
  create: async (data) => {
    return apiCall('/transaction/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 获取单个交易
  get: async (transactionId) => {
    return apiCall(`/transaction/${transactionId}`);
  },
  
  // 获取交易历史
  getHistory: async (accountId) => {
    return apiCall(`/transaction/history/${accountId}`);
  },
  
  // 获取交易统计
  getStats: async (accountId) => {
    return apiCall(`/transaction/stats/${accountId}`);
  },
};

// 批量支付服务
export const batchPaymentService = {
  // 创建批量支付
  create: async (data) => {
    return apiCall('/batch-payment/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 获取批量支付状态
  get: async (batchId) => {
    return apiCall(`/batch-payment/${batchId}`);
  },
  
  // 获取批量支付历史
  getHistory: async (accountId) => {
    return apiCall(`/batch-payment/history/${accountId}`);
  },
  
  // 上传CSV文件
  uploadCSV: async (accountId, file) => {
    const token = authUtils.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('from_account_id', accountId);
    
    const response = await fetch(`${API_BASE_URL}/batch-payment/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'File upload failed');
    }
    
    return data;
  },
};

// 定时支付服务
export const scheduledPaymentService = {
  // 创建定时支付
  create: async (data) => {
    return apiCall('/scheduled-payment/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 获取定时支付详情
  get: async (scheduledPaymentId) => {
    return apiCall(`/scheduled-payment/${scheduledPaymentId}`);
  },
  
  // 获取定时支付列表
  getList: async (accountId) => {
    return apiCall(`/scheduled-payment/list/${accountId}`);
  },
  
  // 暂停定时支付
  pause: async (scheduledPaymentId) => {
    return apiCall(`/scheduled-payment/${scheduledPaymentId}/pause`, {
      method: 'POST',
    });
  },
  
  // 恢复定时支付
  resume: async (scheduledPaymentId) => {
    return apiCall(`/scheduled-payment/${scheduledPaymentId}/resume`, {
      method: 'POST',
    });
  },
  
  // 取消定时支付
  cancel: async (scheduledPaymentId) => {
    return apiCall(`/scheduled-payment/${scheduledPaymentId}/cancel`, {
      method: 'POST',
    });
  },
};

// 账户服务
export const accountService = {
  // 获取账户信息
  get: async (accountId) => {
    return apiCall(`/account/${accountId}`);
  },
  
  // 更新账户信息
  update: async (accountId, data) => {
    return apiCall(`/account/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// 通知服务
export const notificationService = {
  // 获取通知列表
  get: async (accountId) => {
    return apiCall(`/notification/${accountId}`);
  },
  
  // 标记为已读
  markRead: async (notificationId) => {
    return apiCall(`/notification/${notificationId}/read`, {
      method: 'PUT',
    });
  },
  
  // 标记全部为已读
  markAllRead: async (accountId) => {
    return apiCall(`/notification/${accountId}/read-all`, {
      method: 'PUT',
    });
  },
};

// Stream Payment Service
export const streamPaymentService = {
  // 创建流支付
  create: async (data) => {
    return apiCall('/stream-payment/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // 获取流支付详情
  get: async (streamId) => {
    return apiCall(`/stream-payment/${streamId}`);
  },
  
  // 获取流支付列表
  getList: async (accountId, type = 'all') => {
    return apiCall(`/stream-payment/list/${accountId}?type=${type}`);
  },
  
  // 暂停流支付
  pause: async (streamId) => {
    return apiCall(`/stream-payment/${streamId}/pause`, {
      method: 'POST',
    });
  },
  
  // 恢复流支付
  resume: async (streamId) => {
    return apiCall(`/stream-payment/${streamId}/resume`, {
      method: 'POST',
    });
  },
  
  // 取消流支付
  cancel: async (streamId) => {
    return apiCall(`/stream-payment/${streamId}/cancel`, {
      method: 'POST',
    });
  },
  
  // 获取可提取金额
  getAvailable: async (streamId) => {
    return apiCall(`/stream-payment/${streamId}/available`);
  },
  
  // 提取资金
  withdraw: async (streamId) => {
    return apiCall(`/stream-payment/${streamId}/withdraw`, {
      method: 'POST',
    });
  },
};

export default {
  transactionService,
  batchPaymentService,
  scheduledPaymentService,
  accountService,
  notificationService,
  streamPaymentService,
};
