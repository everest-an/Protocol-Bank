const express = require('express');
const router = express.Router();
const streamPaymentController = require('../controllers/streamPaymentController');

/**
 * @route POST /api/v1/stream-payment/create
 * @desc 创建流支付
 * @access Private
 */
router.post('/create', streamPaymentController.createStreamPayment);

/**
 * @route GET /api/v1/stream-payment/:stream_id
 * @desc 获取流支付详情
 * @access Private
 */
router.get('/:stream_id', streamPaymentController.getStreamPayment);

/**
 * @route GET /api/v1/stream-payment/list/:account_id
 * @desc 获取账户的流支付列表
 * @access Private
 */
router.get('/list/:account_id', streamPaymentController.getStreamPaymentsList);

/**
 * @route POST /api/v1/stream-payment/:stream_id/pause
 * @desc 暂停流支付
 * @access Private
 */
router.post('/:stream_id/pause', streamPaymentController.pauseStreamPayment);

/**
 * @route POST /api/v1/stream-payment/:stream_id/resume
 * @desc 恢复流支付
 * @access Private
 */
router.post('/:stream_id/resume', streamPaymentController.resumeStreamPayment);

/**
 * @route POST /api/v1/stream-payment/:stream_id/cancel
 * @desc 取消流支付
 * @access Private
 */
router.post('/:stream_id/cancel', streamPaymentController.cancelStreamPayment);

/**
 * @route GET /api/v1/stream-payment/:stream_id/available
 * @desc 获取可提取金额
 * @access Private
 */
router.get('/:stream_id/available', streamPaymentController.getAvailableBalance);

/**
 * @route POST /api/v1/stream-payment/:stream_id/withdraw
 * @desc 提取资金
 * @access Private
 */
router.post('/:stream_id/withdraw', streamPaymentController.withdrawFromStream);

module.exports = router;
