import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingSpinner Component
 * 通用加载动画组件
 */
export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * FullPageLoading Component
 * 全屏加载动画
 */
export function FullPageLoading({ text = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

/**
 * InlineLoading Component
 * 行内加载动画
 */
export function InlineLoading({ text = 'Loading...' }) {
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}

/**
 * CardLoading Component
 * 卡片加载骨架屏
 */
export function CardLoading({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 animate-pulse"
        >
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * TableLoading Component
 * 表格加载骨架屏
 */
export function TableLoading({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-10 bg-gray-200 dark:bg-gray-800 rounded flex-1"
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}
