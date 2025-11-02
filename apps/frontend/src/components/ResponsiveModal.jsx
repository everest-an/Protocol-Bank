import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 响应式模态框组件
 * 
 * 移动端：全屏显示
 * 桌面端：居中弹窗
 */
const ResponsiveModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md' // 'sm', 'md', 'lg', 'xl', 'full'
}) => {
  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
    '2xl': 'md:max-w-2xl',
    full: 'md:max-w-full md:m-4'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* 模态框容器 */}
      <div className="flex min-h-full items-end md:items-center justify-center p-0 md:p-4">
        {/* 模态框内容 */}
        <div className={`
          relative w-full bg-white dark:bg-gray-900 shadow-xl
          
          /* 移动端：全屏，从底部滑入 */
          h-full md:h-auto
          rounded-t-2xl md:rounded-lg
          
          /* 桌面端：居中，最大宽度 */
          ${sizeClasses[size]}
          
          /* 动画 */
          transform transition-all
          
          /* 最大高度 */
          max-h-full md:max-h-[90vh]
          
          /* 布局 */
          flex flex-col
        `}>
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
            {/* 移动端：顶部指示器 */}
            <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mt-4 md:mt-0">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* 内容区域 - 可滚动 */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </div>

          {/* 底部 */}
          {footer && (
            <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-800/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 底部抽屉组件（仅移动端）
 * 用于快速操作和选择
 */
export const BottomSheet = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 抽屉内容 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* 顶部指示器 */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* 标题 */}
        {title && (
          <div className="px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveModal;
