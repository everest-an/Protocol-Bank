/**
 * 通知组件
 * Notification Component
 * 
 * 用于显示成功、错误、警告和信息通知
 * Display success, error, warning, and info notifications
 */

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

/**
 * 通知类型图标映射
 * Notification Type Icon Mapping
 */
const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

/**
 * 通知类型样式映射
 * Notification Type Style Mapping
 */
const styleMap = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    title: 'text-green-900 dark:text-green-100',
    message: 'text-green-700 dark:text-green-300'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    message: 'text-red-700 dark:text-red-300'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    title: 'text-yellow-900 dark:text-yellow-100',
    message: 'text-yellow-700 dark:text-yellow-300'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    message: 'text-blue-700 dark:text-blue-300'
  }
}

/**
 * 单个通知项组件
 * Single Notification Item Component
 */
function NotificationItem({ notification, onClose }) {
  const { id, type = 'info', title, message, duration = 5000 } = notification
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  const Icon = iconMap[type]
  const styles = styleMap[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose(id)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border
        ${styles.bg} ${styles.border}
        transform transition-all duration-300
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-medium ${styles.title}`}>
            {title}
          </h4>
        )}
        {message && (
          <p className={`text-sm ${styles.message} ${title ? 'mt-1' : ''}`}>
            {message}
          </p>
        )}
      </div>

      <button
        onClick={handleClose}
        className={`flex-shrink-0 ${styles.icon} hover:opacity-70 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/**
 * 通知容器组件
 * Notification Container Component
 */
export default function NotificationContainer({ notifications, onRemove }) {
  if (!notifications || notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={onRemove}
        />
      ))}
    </div>
  )
}

/**
 * 通知 Hook
 * Notification Hook
 * 
 * 用于在组件中管理通知
 * Manage notifications in components
 */
export function useNotification() {
  const [notifications, setNotifications] = useState([])

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [...prev, { ...notification, id }])
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // 便捷方法 / Convenience methods
  const success = (title, message, duration) => {
    return addNotification({ type: 'success', title, message, duration })
  }

  const error = (title, message, duration) => {
    return addNotification({ type: 'error', title, message, duration })
  }

  const warning = (title, message, duration) => {
    return addNotification({ type: 'warning', title, message, duration })
  }

  const info = (title, message, duration) => {
    return addNotification({ type: 'info', title, message, duration })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
}

