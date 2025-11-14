import { Loader2 } from 'lucide-react';

/**
 * Loading Overlay Component
 * 
 * A full-screen loading overlay with a spinner and optional message.
 * 
 * Usage:
 * ```jsx
 * import LoadingOverlay from './components/LoadingOverlay';
 * 
 * function MyComponent() {
 *   const [isLoading, setIsLoading] = useState(false);
 *   
 *   return (
 *     <>
 *       {isLoading && <LoadingOverlay message="Processing transaction..." />}
 *       <YourContent />
 *     </>
 *   );
 * }
 * ```
 */
export default function LoadingOverlay({ message = 'Loading...', fullScreen = true }) {
  const containerClass = fullScreen
    ? 'fixed inset-0 z-50'
    : 'absolute inset-0 z-10';

  return (
    <div className={`${containerClass} bg-black/50 backdrop-blur-sm flex items-center justify-center`}>
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[300px]">
        {/* Spinner */}
        <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
        
        {/* Message */}
        <p className="text-gray-900 dark:text-white font-medium text-center">
          {message}
        </p>
        
        {/* Subtext */}
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Please wait...
        </p>
      </div>
    </div>
  );
}

/**
 * Inline Loading Component
 * 
 * A smaller loading indicator for inline use.
 */
export function InlineLoading({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center gap-3">
      <Loader2 className={`${sizeClasses[size]} text-blue-600 dark:text-blue-400 animate-spin`} />
      <span className="text-gray-600 dark:text-gray-300">{message}</span>
    </div>
  );
}

/**
 * Button Loading Component
 * 
 * A loading state for buttons.
 */
export function ButtonLoading({ message = 'Processing...' }) {
  return (
    <span className="flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      {message}
    </span>
  );
}
