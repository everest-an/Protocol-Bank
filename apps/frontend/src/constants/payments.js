/**
 * Payment Constants
 * 
 * Centralized constants for payment-related functionality.
 */

/**
 * Payment Categories
 */
export const PAYMENT_CATEGORIES = {
  SALARY: 'Salary',
  CONTRACTOR: 'Contractor',
  VENDOR: 'Vendor',
  SUPPLIER: 'Supplier',
  UTILITIES: 'Utilities',
  RENT: 'Rent',
  MARKETING: 'Marketing',
  OTHER: 'Other'
};

/**
 * Payment Category Options (for dropdowns)
 */
export const PAYMENT_CATEGORY_OPTIONS = Object.entries(PAYMENT_CATEGORIES).map(
  ([key, value]) => ({
    value: key.toLowerCase(),
    label: value
  })
);

/**
 * Payment Status
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Payment Status Labels
 */
export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PROCESSING]: 'Processing',
  [PAYMENT_STATUS.COMPLETED]: 'Completed',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelled'
};

/**
 * Payment Status Colors (for badges)
 */
export const PAYMENT_STATUS_COLORS = {
  [PAYMENT_STATUS.PENDING]: 'warning',
  [PAYMENT_STATUS.PROCESSING]: 'info',
  [PAYMENT_STATUS.COMPLETED]: 'success',
  [PAYMENT_STATUS.FAILED]: 'error',
  [PAYMENT_STATUS.CANCELLED]: 'default'
};

/**
 * Payment Types
 */
export const PAYMENT_TYPES = {
  ONE_TIME: 'one_time',
  STREAM: 'stream',
  BATCH: 'batch',
  SCHEDULED: 'scheduled'
};

/**
 * Payment Type Labels
 */
export const PAYMENT_TYPE_LABELS = {
  [PAYMENT_TYPES.ONE_TIME]: 'One-time Payment',
  [PAYMENT_TYPES.STREAM]: 'Stream Payment',
  [PAYMENT_TYPES.BATCH]: 'Batch Payment',
  [PAYMENT_TYPES.SCHEDULED]: 'Scheduled Payment'
};

/**
 * Stream Payment Intervals
 */
export const STREAM_INTERVALS = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000 // 30 days
};

/**
 * Stream Interval Labels
 */
export const STREAM_INTERVAL_LABELS = {
  [STREAM_INTERVALS.SECOND]: 'per second',
  [STREAM_INTERVALS.MINUTE]: 'per minute',
  [STREAM_INTERVALS.HOUR]: 'per hour',
  [STREAM_INTERVALS.DAY]: 'per day',
  [STREAM_INTERVALS.WEEK]: 'per week',
  [STREAM_INTERVALS.MONTH]: 'per month'
};

/**
 * Default Payment Limits
 */
export const PAYMENT_LIMITS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1000000,
  MAX_BATCH_SIZE: 100,
  MAX_DESCRIPTION_LENGTH: 200
};

export default {
  PAYMENT_CATEGORIES,
  PAYMENT_CATEGORY_OPTIONS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  STREAM_INTERVALS,
  STREAM_INTERVAL_LABELS,
  PAYMENT_LIMITS
};
