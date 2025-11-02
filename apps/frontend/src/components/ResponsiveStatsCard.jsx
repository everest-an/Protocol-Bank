import React from 'react';
import { Card } from '@/components/ui/card';

/**
 * 响应式统计卡片组件
 * 
 * 特性：
 * - 移动端：2列布局
 * - 平板：2列布局  
 * - 桌面：4列布局
 * - 触摸友好的最小高度
 */
const ResponsiveStatsCard = ({ icon: Icon, label, value, change, trend }) => {
  return (
    <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between">
      <div className="flex items-start justify-between mb-3">
        <div className={`
          p-2 sm:p-3 rounded-lg
          ${trend === 'up' ? 'bg-green-50 dark:bg-green-900/20' : 
            trend === 'down' ? 'bg-red-50 dark:bg-red-900/20' : 
            'bg-blue-50 dark:bg-blue-900/20'}
        `}>
          <Icon className={`
            h-5 w-5 sm:h-6 sm:w-6
            ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 
              trend === 'down' ? 'text-red-600 dark:text-red-400' : 
              'text-blue-600 dark:text-blue-400'}
          `} />
        </div>
        {change && (
          <span className={`
            text-xs sm:text-sm font-medium px-2 py-1 rounded-full
            ${trend === 'up' ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 
              'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'}
          `}>
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </Card>
  );
};

/**
 * 响应式统计卡片网格容器
 * 
 * 断点：
 * - < 640px (mobile): 2列
 * - >= 640px (sm): 2列
 * - >= 768px (md): 4列
 */
export const ResponsiveStatsGrid = ({ children }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {children}
    </div>
  );
};

export default ResponsiveStatsCard;
