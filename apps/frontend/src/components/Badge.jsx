import React from 'react';

/**
 * Badge Component
 * 
 * A reusable badge component for status indicators and labels.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.variant - Badge variant ('success', 'error', 'warning', 'info', 'default')
 * @param {string} props.size - Badge size ('sm', 'md', 'lg')
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" size="sm">Failed</Badge>
 */
export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  ...props 
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const variantClasses = {
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    default: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
