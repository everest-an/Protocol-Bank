import React, { useEffect, useState } from 'react';

/**
 * FadeIn Animation Component
 * Fades in children with customizable duration and delay
 */
export const FadeIn = ({ 
  children, 
  duration = 300, 
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${duration}ms ease-in-out`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * SlideIn Animation Component
 * Slides in children from specified direction
 */
export const SlideIn = ({ 
  children, 
  direction = 'up', // 'up', 'down', 'left', 'right'
  duration = 300, 
  delay = 0,
  distance = 20,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)';
    
    switch (direction) {
      case 'up':
        return `translate(0, ${distance}px)`;
      case 'down':
        return `translate(0, -${distance}px)`;
      case 'left':
        return `translate(${distance}px, 0)`;
      case 'right':
        return `translate(-${distance}px, 0)`;
      default:
        return 'translate(0, 0)';
    }
  };

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `all ${duration}ms ease-out`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * ScaleIn Animation Component
 * Scales in children with customizable origin
 */
export const ScaleIn = ({ 
  children, 
  duration = 300, 
  delay = 0,
  origin = 'center', // 'center', 'top', 'bottom', 'left', 'right'
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getTransformOrigin = () => {
    switch (origin) {
      case 'top':
        return 'top center';
      case 'bottom':
        return 'bottom center';
      case 'left':
        return 'center left';
      case 'right':
        return 'center right';
      default:
        return 'center';
    }
  };

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.9)',
        transformOrigin: getTransformOrigin(),
        transition: `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Stagger Animation Component
 * Animates children with staggered delays
 */
export const Stagger = ({ 
  children, 
  staggerDelay = 50,
  animation = 'fade', // 'fade', 'slide', 'scale'
  direction = 'up',
  className = ''
}) => {
  const childrenArray = React.Children.toArray(children);

  const AnimationComponent = {
    fade: FadeIn,
    slide: SlideIn,
    scale: ScaleIn,
  }[animation] || FadeIn;

  return (
    <div className={className}>
      {childrenArray.map((child, index) => (
        <AnimationComponent
          key={index}
          delay={index * staggerDelay}
          direction={direction}
        >
          {child}
        </AnimationComponent>
      ))}
    </div>
  );
};

/**
 * Pulse Animation Component
 * Creates a pulsing effect
 */
export const Pulse = ({ 
  children, 
  duration = 2000,
  scale = 1.05,
  className = ''
}) => {
  return (
    <div
      className={className}
      style={{
        animation: `pulse ${duration}ms ease-in-out infinite`,
      }}
    >
      {children}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(${scale});
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Bounce Animation Component
 * Creates a bouncing effect on mount
 */
export const Bounce = ({ 
  children, 
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        animation: isVisible ? 'bounce 600ms ease-out' : 'none',
      }}
    >
      {children}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-10px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Shimmer Animation Component
 * Creates a shimmer loading effect
 */
export const Shimmer = ({ 
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = ''
}) => {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default {
  FadeIn,
  SlideIn,
  ScaleIn,
  Stagger,
  Pulse,
  Bounce,
  Shimmer,
};
