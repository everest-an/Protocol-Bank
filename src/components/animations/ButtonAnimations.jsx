import React, { useState } from 'react';

/**
 * Ripple Effect Component
 * Adds Material Design ripple effect to buttons
 */
export const RippleButton = ({ 
  children, 
  onClick, 
  className = '',
  ...props 
}) => {
  const [ripples, setRipples] = useState([]);

  const addRipple = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    if (onClick) onClick(event);
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={addRipple}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            transform: 'scale(0)',
            animation: 'ripple 600ms ease-out',
            pointerEvents: 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </button>
  );
};

/**
 * Loading Button Component
 * Button with built-in loading state
 */
export const LoadingButton = ({ 
  children, 
  loading = false,
  loadingText = 'Loading...',
  onClick,
  disabled,
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`relative ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      <span
        style={{
          opacity: loading ? 0 : 1,
          transition: 'opacity 200ms',
        }}
      >
        {children}
      </span>
      {loading && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 600ms linear infinite',
            }}
          />
          {loadingText}
        </span>
      )}
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
};

/**
 * Success Button Component
 * Button that shows success state
 */
export const SuccessButton = ({ 
  children, 
  success = false,
  successText = 'Success!',
  successDuration = 2000,
  onClick,
  className = '',
  ...props 
}) => {
  const [showSuccess, setShowSuccess] = useState(false);

  React.useEffect(() => {
    if (success) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, successDuration);
      return () => clearTimeout(timer);
    }
  }, [success, successDuration]);

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
      {...props}
    >
      <span
        style={{
          opacity: showSuccess ? 0 : 1,
          transform: showSuccess ? 'translateY(-20px)' : 'translateY(0)',
          transition: 'all 300ms ease-out',
        }}
      >
        {children}
      </span>
      {showSuccess && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'slideUp 300ms ease-out',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 4.5L6 12L2.5 8.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {successText}
        </span>
      )}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </button>
  );
};

/**
 * Hover Scale Button Component
 * Button that scales on hover
 */
export const HoverScaleButton = ({ 
  children, 
  scale = 1.05,
  duration = 200,
  className = '',
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? `scale(${scale})` : 'scale(1)',
        transition: `transform ${duration}ms ease-out`,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Shake Button Component
 * Button that shakes on error
 */
export const ShakeButton = ({ 
  children, 
  shake = false,
  onShakeEnd,
  className = '',
  ...props 
}) => {
  const [isShaking, setIsShaking] = useState(false);

  React.useEffect(() => {
    if (shake) {
      setIsShaking(true);
      const timer = setTimeout(() => {
        setIsShaking(false);
        if (onShakeEnd) onShakeEnd();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shake, onShakeEnd]);

  return (
    <button
      className={className}
      style={{
        animation: isShaking ? 'shake 500ms ease-in-out' : 'none',
      }}
      {...props}
    >
      {children}
      <style>{`
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-10px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(10px);
          }
        }
      `}</style>
    </button>
  );
};

export default {
  RippleButton,
  LoadingButton,
  SuccessButton,
  HoverScaleButton,
  ShakeButton,
};
