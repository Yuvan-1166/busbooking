/**
 * Badge Component
 * 
 * A reusable badge component for status indicators and labels.
 * Supports multiple variants based on the design system.
 */

export default function Badge({ 
  children, 
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props 
}) {
  const baseClass = 'badge'
  
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    neutral: 'badge-neutral',
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }
  
  const classes = `${baseClass} ${variantClasses[variant] || ''} ${sizeClasses[size] || ''} ${className}`
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}
