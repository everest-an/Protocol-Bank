import React from 'react';

/**
 * Card Component
 * 
 * A reusable card component with consistent styling.
 * Supports glass morphism effect and hover states.
 * 
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover effect (default: false)
 * @param {boolean} props.glass - Enable glass morphism effect (default: true)
 * @param {Function} props.onClick - Click handler
 * 
 * @example
 * <Card hover onClick={() => console.log('clicked')}>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 */
export function Card({ 
  children, 
  className = '', 
  hover = false, 
  glass = true,
  onClick,
  ...props 
}) {
  const baseClasses = 'rounded-xl p-6';
  
  const glassClasses = glass
    ? 'bg-white/5 backdrop-blur-md border border-white/10'
    : 'bg-gray-800 border border-gray-700';
  
  const hoverClasses = hover
    ? 'hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer'
    : '';
  
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${glassClasses} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
