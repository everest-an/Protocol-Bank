const express = require('express');
const router = express.Router();
const scheduledPaymentController = require('../controllers/scheduledPaymentController');

/**
 * @route POST /api/v1/scheduled-payment/create
 * @desc 创建定时支付
 */
router.post('/create', scheduledPaymentController.createScheduledPayment);

/**
 * @route GET /api/v1/scheduled-payment/list/:account_id
 * @desc 获取账户的定时支付列表 (must be before /:scheduled_payment_id)
 */
router.get('/list/:account_id', scheduledPaymentController.getScheduledPaymentsList);

/**
 * @route GET /api/v1/scheduled-payment/:scheduled_payment_id
 * @desc 获取定时支付详情
 */
router.get('/:scheduled_payment_id', scheduledPaymentController.getScheduledPayment);

/**
 * @route POST /api/v1/scheduled-payment/:scheduled_payment_id/pause
 * @desc 暂停定时支付
 */
router.post('/:scheduled_payment_id/pause', scheduledPaymentController.pauseScheduledPayment);

/**
 * @route POST /api/v1/scheduled-payment/:scheduled_payment_id/resume
 * @desc 恢复定时支付
 */
router.post('/:scheduled_payment_id/resume', scheduledPaymentController.resumeScheduledPayment);

/**
 * @route POST /api/v1/scheduled-payment/:scheduled_payment_id/cancel
 * @desc 取消定时支付
 */
router.post('/:scheduled_payment_id/cancel', scheduledPaymentController.cancelScheduledPayment);

module.exports = router;
