import React from 'react';

/**
 * Alert Component
 * 
 * A reusable alert component for displaying notifications and messages.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Alert content
 * @param {string} props.variant - Alert variant ('success', 'error', 'warning', 'info')
 * @param {string} props.title - Alert title (optional)
 * @param {boolean} props.dismissible - Show close button (default: false)
 * @param {Function} props.onClose - Close handler
 * @param {string} props.className - Additional CSS classes
 * 
 * @example
 * <Alert variant="success" title="Success!">
 *   Payment completed successfully.
 * </Alert>
 * 
 * <Alert variant="error" dismissible onClose={() => console.log('closed')}>
 *   Transaction failed. Please try again.
 * </Alert>
 */
export function Alert({ 
  children, 
  variant = 'info', 
  title,
  dismissible = false,
  onClose,
  className = '',
  ...props 
}) {
  const variantClasses = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  };

  const iconClasses = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div
      className={`rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <div className="flex items-start">
        <span className="text-xl mr-3">{iconClasses[variant]}</span>
        <div className="flex-1">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <div className="text-sm opacity-90">{children}</div>
        </div>
        {dismissible && onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-current opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;
