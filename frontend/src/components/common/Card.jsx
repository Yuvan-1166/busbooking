/**
 * Card Component
 * 
 * A reusable card component for containing content.
 * Supports hover effects and custom styling.
 */

export default function Card({ 
  children, 
  hover = false,
  className = '',
  padding = true,
  ...props 
}) {
  const baseClass = 'card'
  const hoverClass = hover ? 'card-hover' : ''
  const paddingClass = padding ? '' : 'p-0'
  
  const classes = `${baseClass} ${hoverClass} ${paddingClass} ${className}`
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

/**
 * CardHeader Component
 */
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

/**
 * CardTitle Component
 */
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-neutral-900 ${className}`}>
      {children}
    </h3>
  )
}

/**
 * CardBody Component
 */
export function CardBody({ children, className = '' }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

/**
 * CardFooter Component
 */
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 border-t border-neutral-200 pt-4 ${className}`}>
      {children}
    </div>
  )
}
