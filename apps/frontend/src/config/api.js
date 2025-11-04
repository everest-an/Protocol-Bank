// API Configuration for Protocol Bank Backend
export const API_CONFIG = {
  // 生产环境后端API地址（需要部署后更新）
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://protocolbanks.com',
  
  // API版本
  API_VERSION: 'v1',
  
  // 超时设置
  TIMEOUT: 30000,
  
  // WebSocket配置
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://protocolbanks.com',
};

// API端点
export const API_ENDPOINTS = {
  // 账户管理
  ACCOUNTS: {
    CREATE: '/api/v1/account/create',
    GET: (id) => `/api/v1/account/${id}`,
    UPDATE: (id) => `/api/v1/account/${id}/update`,
    DEPOSIT: (id) => `/api/v1/account/${id}/deposit`,
    WITHDRAW: (id) => `/api/v1/account/${id}/withdraw`,
  },
  
  // 交易管理
  TRANSACTIONS: {
    CREATE: '/api/v1/transaction/create',
    GET: (id) => `/api/v1/transaction/${id}`,
    LIST: '/api/v1/transaction',
  },
  
  // 批量支付
  BATCH_PAYMENT: {
    CREATE: '/api/v1/batch-payment/create',
    EXECUTE: (id) => `/api/v1/batch-payment/${id}/execute`,
    GET: (id) => `/api/v1/batch-payment/${id}`,
    LIST: '/api/v1/batch-payment',
  },
  
  // 定时支付
  SCHEDULED_PAYMENT: {
    CREATE: '/api/v1/scheduled-payment/create',
    GET: (id) => `/api/v1/scheduled-payment/${id}`,
    LIST: '/api/v1/scheduled-payment',
    PAUSE: (id) => `/api/v1/scheduled-payment/${id}/pause`,
    RESUME: (id) => `/api/v1/scheduled-payment/${id}/resume`,
    CANCEL: (id) => `/api/v1/scheduled-payment/${id}/cancel`,
  },
  
  // Firefly III集成
  FIREFLY: {
    STATUS: '/api/v1/firefly/status',
    SYNC_ACCOUNTS: '/api/v1/firefly/sync/accounts',
    SYNC_ACCOUNT: (id) => `/api/v1/firefly/sync/account/${id}`,
    SYNC_TRANSACTION: (id) => `/api/v1/firefly/sync/transaction/${id}`,
    INSIGHTS: (id) => `/api/v1/firefly/insights/${id}`,
    BUDGETS: '/api/v1/firefly/budgets',
    CATEGORIES: '/api/v1/firefly/categories',
    DASHBOARD: (id) => `/api/v1/firefly/dashboard/${id}`,
  },
  
  // AML (反洗钱)
  AML: {
    ASSESS: (id) => `/api/v1/aml/assess/${id}`,
    SCORE: (id) => `/api/v1/aml/score/${id}`,
    HIGH_RISK: '/api/v1/aml/high-risk-transactions',
    ACCOUNT_PROFILE: (id) => `/api/v1/aml/account/${id}/profile`,
    UPDATE_PROFILE: (id) => `/api/v1/aml/account/${id}/profile`,
    BLACKLIST: '/api/v1/aml/blacklist',
    ADD_BLACKLIST: '/api/v1/aml/blacklist',
    REMOVE_BLACKLIST: (address) => `/api/v1/aml/blacklist/${address}`,
    SUSPICIOUS_REPORTS: '/api/v1/aml/suspicious-reports',
    CREATE_REPORT: '/api/v1/aml/suspicious-report',
    RULES: '/api/v1/aml/rules',
    STATISTICS: '/api/v1/aml/statistics',
    AUDIT_LOGS: '/api/v1/aml/audit-logs',
  },
  
  // KYC (身份验证)
  KYC: {
    CREATE_APPLICATION: '/api/v1/kyc/application',
    GET_APPLICATION: (id) => `/api/v1/kyc/application/${id}`,
    SUBMIT_INDIVIDUAL: (id) => `/api/v1/kyc/application/${id}/individual`,
    SUBMIT_BUSINESS: (id) => `/api/v1/kyc/application/${id}/business`,
    UPLOAD_DOCUMENT: (id) => `/api/v1/kyc/application/${id}/document`,
    SUBMIT_BIOMETRIC: (id) => `/api/v1/kyc/application/${id}/biometric`,
    ASSESS_RISK: (id) => `/api/v1/kyc/application/${id}/assess`,
    REVIEW: (id) => `/api/v1/kyc/application/${id}/review`,
    STATISTICS: '/api/v1/kyc/statistics',
  },
  
  // 通知系统
  NOTIFICATIONS: {
    GET: (accountId) => `/api/v1/notifications/${accountId}`,
    MARK_READ: (id) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: (accountId) => `/api/v1/notifications/${accountId}/read-all`,
    DELETE: (id) => `/api/v1/notifications/${id}`,
  },
};
