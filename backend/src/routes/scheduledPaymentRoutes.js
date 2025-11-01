const express = require('express');
const router = express.Router();
const scheduledPaymentController = require('../controllers/scheduledPaymentController');

/**
 * @route POST /api/v1/scheduled-payment/create
 * @desc 创建定时支付
 */
router.post('/create', scheduledPaymentController.createScheduledPayment);

/**
 * @route GET /api/v1/scheduled-payment/:schedule_id
 * @desc 获取定时支付详情
 */
router.get('/:schedule_id', scheduledPaymentController.getScheduledPayment);

/**
 * @route GET /api/v1/scheduled-payment/list/:account_id
 * @desc 获取账户的定时支付列表
 */
router.get('/list/:account_id', scheduledPaymentController.getScheduledPaymentsList);

/**
 * @route PUT /api/v1/scheduled-payment/:schedule_id/pause
 * @desc 暂停定时支付
 */
router.put('/:schedule_id/pause', scheduledPaymentController.pauseScheduledPayment);

/**
 * @route PUT /api/v1/scheduled-payment/:schedule_id/resume
 * @desc 恢复定时支付
 */
router.put('/:schedule_id/resume', scheduledPaymentController.resumeScheduledPayment);

/**
 * @route DELETE /api/v1/scheduled-payment/:schedule_id
 * @desc 取消定时支付
 */
router.delete('/:schedule_id', scheduledPaymentController.cancelScheduledPayment);

module.exports = router;
