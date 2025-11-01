import apiClient from './apiService';
import { API_ENDPOINTS } from '../config/api';

// 账户服务
export const accountService = {
  create: (data) => apiClient.post(API_ENDPOINTS.ACCOUNTS.CREATE, data),
  get: (id) => apiClient.get(API_ENDPOINTS.ACCOUNTS.GET(id)),
  update: (id, data) => apiClient.put(API_ENDPOINTS.ACCOUNTS.UPDATE(id), data),
  deposit: (id, amount) => apiClient.post(API_ENDPOINTS.ACCOUNTS.DEPOSIT(id), { amount }),
  withdraw: (id, amount) => apiClient.post(API_ENDPOINTS.ACCOUNTS.WITHDRAW(id), { amount }),
};

// 交易服务
export const transactionService = {
  create: (data) => apiClient.post(API_ENDPOINTS.TRANSACTIONS.CREATE, data),
  get: (id) => apiClient.get(API_ENDPOINTS.TRANSACTIONS.GET(id)),
  list: (params) => apiClient.get(API_ENDPOINTS.TRANSACTIONS.LIST, { params }),
};

// 批量支付服务
export const batchPaymentService = {
  create: (data) => apiClient.post(API_ENDPOINTS.BATCH_PAYMENT.CREATE, data),
  execute: (id) => apiClient.post(API_ENDPOINTS.BATCH_PAYMENT.EXECUTE(id)),
  get: (id) => apiClient.get(API_ENDPOINTS.BATCH_PAYMENT.GET(id)),
  list: (params) => apiClient.get(API_ENDPOINTS.BATCH_PAYMENT.LIST, { params }),
};

// 定时支付服务
export const scheduledPaymentService = {
  create: (data) => apiClient.post(API_ENDPOINTS.SCHEDULED_PAYMENT.CREATE, data),
  get: (id) => apiClient.get(API_ENDPOINTS.SCHEDULED_PAYMENT.GET(id)),
  list: (params) => apiClient.get(API_ENDPOINTS.SCHEDULED_PAYMENT.LIST, { params }),
  pause: (id) => apiClient.put(API_ENDPOINTS.SCHEDULED_PAYMENT.PAUSE(id)),
  resume: (id) => apiClient.put(API_ENDPOINTS.SCHEDULED_PAYMENT.RESUME(id)),
  cancel: (id) => apiClient.delete(API_ENDPOINTS.SCHEDULED_PAYMENT.CANCEL(id)),
};

// Firefly III服务
export const fireflyService = {
  getStatus: () => apiClient.get(API_ENDPOINTS.FIREFLY.STATUS),
  syncAccounts: () => apiClient.post(API_ENDPOINTS.FIREFLY.SYNC_ACCOUNTS),
  syncAccount: (id) => apiClient.post(API_ENDPOINTS.FIREFLY.SYNC_ACCOUNT(id)),
  syncTransaction: (id) => apiClient.post(API_ENDPOINTS.FIREFLY.SYNC_TRANSACTION(id)),
  getInsights: (id) => apiClient.get(API_ENDPOINTS.FIREFLY.INSIGHTS(id)),
  getBudgets: () => apiClient.get(API_ENDPOINTS.FIREFLY.BUDGETS),
  getCategories: () => apiClient.get(API_ENDPOINTS.FIREFLY.CATEGORIES),
  getDashboard: (id) => apiClient.get(API_ENDPOINTS.FIREFLY.DASHBOARD(id)),
};

// AML服务
export const amlService = {
  assessTransaction: (id) => apiClient.post(API_ENDPOINTS.AML.ASSESS(id)),
  getScore: (id) => apiClient.get(API_ENDPOINTS.AML.SCORE(id)),
  getHighRiskTransactions: (params) => apiClient.get(API_ENDPOINTS.AML.HIGH_RISK, { params }),
  getAccountProfile: (id) => apiClient.get(API_ENDPOINTS.AML.ACCOUNT_PROFILE(id)),
  updateAccountProfile: (id, data) => apiClient.post(API_ENDPOINTS.AML.UPDATE_PROFILE(id), data),
  getBlacklist: () => apiClient.get(API_ENDPOINTS.AML.BLACKLIST),
  addToBlacklist: (data) => apiClient.post(API_ENDPOINTS.AML.ADD_BLACKLIST, data),
  removeFromBlacklist: (address) => apiClient.delete(API_ENDPOINTS.AML.REMOVE_BLACKLIST(address)),
  getSuspiciousReports: (params) => apiClient.get(API_ENDPOINTS.AML.SUSPICIOUS_REPORTS, { params }),
  createReport: (data) => apiClient.post(API_ENDPOINTS.AML.CREATE_REPORT, data),
  getRules: () => apiClient.get(API_ENDPOINTS.AML.RULES),
  getStatistics: (params) => apiClient.get(API_ENDPOINTS.AML.STATISTICS, { params }),
  getAuditLogs: (params) => apiClient.get(API_ENDPOINTS.AML.AUDIT_LOGS, { params }),
};

// KYC服务
export const kycService = {
  createApplication: (data) => apiClient.post(API_ENDPOINTS.KYC.CREATE_APPLICATION, data),
  getApplication: (id) => apiClient.get(API_ENDPOINTS.KYC.GET_APPLICATION(id)),
  submitIndividual: (id, data) => apiClient.post(API_ENDPOINTS.KYC.SUBMIT_INDIVIDUAL(id), data),
  submitBusiness: (id, data) => apiClient.post(API_ENDPOINTS.KYC.SUBMIT_BUSINESS(id), data),
  uploadDocument: (id, data) => apiClient.post(API_ENDPOINTS.KYC.UPLOAD_DOCUMENT(id), data),
  submitBiometric: (id, data) => apiClient.post(API_ENDPOINTS.KYC.SUBMIT_BIOMETRIC(id), data),
  assessRisk: (id) => apiClient.post(API_ENDPOINTS.KYC.ASSESS_RISK(id)),
  review: (id, data) => apiClient.post(API_ENDPOINTS.KYC.REVIEW(id), data),
  getStatistics: (params) => apiClient.get(API_ENDPOINTS.KYC.STATISTICS, { params }),
};

// 通知服务
export const notificationService = {
  get: (accountId, params) => apiClient.get(API_ENDPOINTS.NOTIFICATIONS.GET(accountId), { params }),
  markRead: (id) => apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),
  markAllRead: (accountId) => apiClient.put(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ(accountId)),
  delete: (id) => apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id)),
};
