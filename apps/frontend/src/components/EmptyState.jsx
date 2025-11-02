import React from 'react';
import { FileX, Database, Inbox, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * EmptyState Component
 * 空状态提示组件
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data available',
  description = 'There is no data to display at the moment.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
        <Icon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * NoResults Component
 * 搜索无结果状态
 */
export function NoResults({ searchTerm }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any results for "${searchTerm}". Try adjusting your search.`}
    />
  );
}

/**
 * NoData Component
 * 无数据状态
 */
export function NoData({ message = 'No data available' }) {
  return (
    <EmptyState
      icon={Database}
      title="No Data"
      description={message}
    />
  );
}

/**
 * EmptyList Component
 * 空列表状态
 */
export function EmptyList({ 
  title = 'Nothing here yet', 
  description = 'Get started by adding your first item.',
  actionLabel,
  onAction 
}) {
  return (
    <EmptyState
      icon={FileX}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}
