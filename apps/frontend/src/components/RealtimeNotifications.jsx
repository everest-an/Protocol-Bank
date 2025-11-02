import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function RealtimeNotifications({ notifications, onRemove }) {
  if (notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTitle = (eventType) => {
    switch (eventType) {
      case 'SupplierRegistered':
        return 'New Supplier Registered';
      case 'PaymentCreated':
        return 'New Payment Created';
      case 'PaymentStatusUpdated':
        return 'Payment Status Updated';
      default:
        return 'Notification';
    }
  };

  const getDescription = (notification) => {
    const { eventType, data } = notification;
    
    switch (eventType) {
      case 'SupplierRegistered':
        return `${data.name} (${data.brand}) has been registered`;
      case 'PaymentCreated':
        return `${data.amount} ETH sent to ${data.to.slice(0, 6)}...${data.to.slice(-4)}`;
      case 'PaymentStatusUpdated':
        return `Payment #${data.id} status: ${data.status}`;
      default:
        return notification.message || 'Event received';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-slide-in-right"
        >
          <div className="flex items-start gap-3">
            {getIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">
                {getTitle(notification.eventType)}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {getDescription(notification)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

