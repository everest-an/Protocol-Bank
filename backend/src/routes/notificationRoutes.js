const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

/**
 * @route POST /api/v1/notifications
 * @desc 创建通知
 */
router.post('/', notificationController.createNotification);

/**
 * @route GET /api/v1/notifications/:account_id
 * @desc 获取用户通知
 */
router.get('/:account_id', notificationController.getUserNotifications);

/**
 * @route GET /api/v1/notifications/:account_id/unread-count
 * @desc 获取未读通知数量
 */
router.get('/:account_id/unread-count', notificationController.getUnreadCount);

/**
 * @route POST /api/v1/notifications/:notification_id/read
 * @desc 标记通知为已读
 */
router.post('/:notification_id/read', notificationController.markAsRead);

/**
 * @route POST /api/v1/notifications/:account_id/read-multiple
 * @desc 批量标记为已读
 */
router.post('/:account_id/read-multiple', notificationController.markMultipleAsRead);

/**
 * @route POST /api/v1/notifications/:account_id/subscription
 * @desc 更新订阅偏好
 */
router.post('/:account_id/subscription', notificationController.updateSubscription);

/**
 * @route GET /api/v1/notifications/:account_id/subscriptions
 * @desc 获取用户订阅
 */
router.get('/:account_id/subscriptions', notificationController.getUserSubscriptions);

module.exports = router;
