const { pool: db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Notification Service
 * 管理通知的创建、发送和订阅
 */
class NotificationService {
  constructor() {
    this.io = null; // Socket.io instance will be set later
  }

  /**
   * 设置Socket.io实例
   */
  setSocketIO(io) {
    this.io = io;
    logger.info('Socket.IO instance set in NotificationService');
  }

  /**
   * 创建通知
   */
  async createNotification(data) {
    try {
      const notificationId = uuidv4();
      
      await db.query(
        `INSERT INTO notifications 
         (notification_id, account_id, notification_type, title, message, data, priority)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          notificationId,
          data.account_id,
          data.notification_type,
          data.title,
          data.message,
          JSON.stringify(data.data || {}),
          data.priority || 'normal'
        ]
      );

      logger.info(`Notification created: ${notificationId}`);

      // 自动发送通知
      await this.sendNotification(notificationId);

      return notificationId;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * 发送通知
   */
  async sendNotification(notificationId) {
    try {
      // 获取通知详情
      const result = await db.query(
        'SELECT * FROM notifications WHERE notification_id = $1',
        [notificationId]
      );

      if (result.rows.length === 0) {
        throw new Error('Notification not found');
      }

      const notification = result.rows[0];

      // 检查用户订阅
      const subscriptionResult = await db.query(
        `SELECT * FROM notification_subscriptions 
         WHERE account_id = $1 AND notification_type = $2 AND channel = 'websocket' AND is_enabled = TRUE`,
        [notification.account_id, notification.notification_type]
      );

      // 如果没有订阅记录，默认发送
      const shouldSend = subscriptionResult.rows.length === 0 || subscriptionResult.rows[0].is_enabled;

      if (shouldSend && this.io) {
        // 发送到特定账户的房间
        this.io.to(`account:${notification.account_id}`).emit('notification', {
          notification_id: notification.notification_id,
          type: notification.notification_type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          created_at: notification.created_at
        });

        // 更新发送状态
        await db.query(
          'UPDATE notifications SET is_sent = TRUE, sent_at = CURRENT_TIMESTAMP WHERE notification_id = $1',
          [notificationId]
        );

        logger.info(`Notification sent: ${notificationId} to account ${notification.account_id}`);
      }
    } catch (error) {
      logger.error('Error sending notification:', error);
      // 不抛出错误，发送失败不应影响主流程
    }
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId) {
    try {
      await db.query(
        'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE notification_id = $1',
        [notificationId]
      );

      logger.info(`Notification marked as read: ${notificationId}`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * 批量标记为已读
   */
  async markMultipleAsRead(accountId, notificationIds) {
    try {
      await db.query(
        'UPDATE notifications SET is_read = TRUE, read_at = CURRENT_TIMESTAMP WHERE account_id = $1 AND notification_id = ANY($2)',
        [accountId, notificationIds]
      );

      logger.info(`${notificationIds.length} notifications marked as read for account ${accountId}`);
    } catch (error) {
      logger.error('Error marking multiple notifications as read:', error);
      throw error;
    }
  }

  /**
   * 获取用户通知
   */
  async getUserNotifications(accountId, options = {}) {
    try {
      const { is_read, notification_type, limit = 50, offset = 0 } = options;

      let query = 'SELECT * FROM notifications WHERE account_id = $1';
      const params = [accountId];

      if (is_read !== undefined) {
        params.push(is_read);
        query += ` AND is_read = $${params.length}`;
      }

      if (notification_type) {
        params.push(notification_type);
        query += ` AND notification_type = $${params.length}`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await db.query(query, params);

      return result.rows;
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(accountId) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as unread_count FROM notifications WHERE account_id = $1 AND is_read = FALSE',
        [accountId]
      );

      return parseInt(result.rows[0].unread_count);
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * 更新订阅偏好
   */
  async updateSubscription(accountId, notificationType, channel, isEnabled) {
    try {
      await db.query(
        `INSERT INTO notification_subscriptions 
         (account_id, notification_type, channel, is_enabled)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (account_id, notification_type, channel)
         DO UPDATE SET is_enabled = $4, updated_at = CURRENT_TIMESTAMP`,
        [accountId, notificationType, channel, isEnabled]
      );

      logger.info(`Subscription updated: ${accountId} - ${notificationType} - ${channel} - ${isEnabled}`);
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * 获取用户订阅
   */
  async getUserSubscriptions(accountId) {
    try {
      const result = await db.query(
        'SELECT * FROM notification_subscriptions WHERE account_id = $1',
        [accountId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error getting user subscriptions:', error);
      throw error;
    }
  }

  /**
   * 记录WebSocket会话
   */
  async recordWebSocketSession(accountId, socketId) {
    try {
      const sessionId = uuidv4();
      
      await db.query(
        `INSERT INTO websocket_sessions 
         (session_id, account_id, socket_id)
         VALUES ($1, $2, $3)`,
        [sessionId, accountId, socketId]
      );

      logger.info(`WebSocket session recorded: ${sessionId} for account ${accountId}`);
      return sessionId;
    } catch (error) {
      logger.error('Error recording WebSocket session:', error);
      throw error;
    }
  }

  /**
   * 断开WebSocket会话
   */
  async disconnectWebSocketSession(socketId) {
    try {
      await db.query(
        'UPDATE websocket_sessions SET is_active = FALSE, disconnected_at = CURRENT_TIMESTAMP WHERE socket_id = $1 AND is_active = TRUE',
        [socketId]
      );

      logger.info(`WebSocket session disconnected: ${socketId}`);
    } catch (error) {
      logger.error('Error disconnecting WebSocket session:', error);
      // 不抛出错误
    }
  }

  /**
   * 更新会话活动时间
   */
  async updateSessionActivity(socketId) {
    try {
      await db.query(
        'UPDATE websocket_sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE socket_id = $1 AND is_active = TRUE',
        [socketId]
      );
    } catch (error) {
      logger.error('Error updating session activity:', error);
      // 不抛出错误
    }
  }

  /**
   * 获取活跃会话数
   */
  async getActiveSessionCount(accountId) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as session_count FROM websocket_sessions WHERE account_id = $1 AND is_active = TRUE',
        [accountId]
      );

      return parseInt(result.rows[0].session_count);
    } catch (error) {
      logger.error('Error getting active session count:', error);
      return 0;
    }
  }
}

module.exports = new NotificationService();
