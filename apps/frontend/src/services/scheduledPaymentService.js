import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * 创建定时支付
 */
export const createScheduledPayment = async (paymentData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scheduled-payment/create`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error creating scheduled payment:', error);
    throw error.response?.data || error;
  }
};

/**
 * 获取定时支付详情
 */
export const getScheduledPayment = async (scheduleId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scheduled-payment/${scheduleId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting scheduled payment:', error);
    throw error.response?.data || error;
  }
};

/**
 * 获取定时支付列表
 */
export const getScheduledPaymentsList = async (accountId, status = null, limit = 50, offset = 0) => {
  try {
    const params = { limit, offset };
    if (status) {
      params.status = status;
    }

    const response = await axios.get(`${API_BASE_URL}/scheduled-payment/list/${accountId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting scheduled payments list:', error);
    throw error.response?.data || error;
  }
};

/**
 * 暂停定时支付
 */
export const pauseScheduledPayment = async (scheduleId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/scheduled-payment/${scheduleId}/pause`);
    return response.data;
  } catch (error) {
    console.error('Error pausing scheduled payment:', error);
    throw error.response?.data || error;
  }
};

/**
 * 恢复定时支付
 */
export const resumeScheduledPayment = async (scheduleId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/scheduled-payment/${scheduleId}/resume`);
    return response.data;
  } catch (error) {
    console.error('Error resuming scheduled payment:', error);
    throw error.response?.data || error;
  }
};

/**
 * 取消定时支付
 */
export const cancelScheduledPayment = async (scheduleId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/scheduled-payment/${scheduleId}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling scheduled payment:', error);
    throw error.response?.data || error;
  }
};
