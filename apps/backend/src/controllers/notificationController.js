const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * 创建通知
 */
exports.createNotification = async (req, res) => {
  try {
    const notificationId = await notificationService.createNotification(req.body);

    res.json({
      status: 'success',
      message: 'Notification created',
      data: { notification_id: notificationId }
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

/**
 * 获取用户通知
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const { account_id } = req.params;
    const notifications = await notificationService.getUserNotifications(account_id, req.query);

    res.json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

/**
 * 获取未读通知数量
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const { account_id } = req.params;
    const count = await notificationService.getUnreadCount(account_id);

    res.json({
      status: 'success',
      data: { unread_count: count }
    });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

/**
 * 标记通知为已读
 */
exports.markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;
    await notificationService.markAsRead(notification_id);

    res.json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Error marking as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark as read',
      error: error.message
    });
  }
};

/**
 * 批量标记为已读
 */
exports.markMultipleAsRead = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { notification_ids } = req.body;

    await notificationService.markMultipleAsRead(account_id, notification_ids);

    res.json({
      status: 'success',
      message: 'Notifications marked as read'
    });
  } catch (error) {
    logger.error('Error marking multiple as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notifications as read',
      error: error.message
    });
  }
};

/**
 * 更新订阅偏好
 */
exports.updateSubscription = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { notification_type, channel, is_enabled } = req.body;

    await notificationService.updateSubscription(account_id, notification_type, channel, is_enabled);

    res.json({
      status: 'success',
      message: 'Subscription updated'
    });
  } catch (error) {
    logger.error('Error updating subscription:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update subscription',
      error: error.message
    });
  }
};

/**
 * 获取用户订阅
 */
exports.getUserSubscriptions = async (req, res) => {
  try {
    const { account_id } = req.params;
    const subscriptions = await notificationService.getUserSubscriptions(account_id);

    res.json({
      status: 'success',
      data: { subscriptions }
    });
  } catch (error) {
    logger.error('Error getting subscriptions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get subscriptions',
      error: error.message
    });
  }
};

module.exports = exports;
