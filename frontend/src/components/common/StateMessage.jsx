/**
 * StateMessage Component
 * 
 * Display empty states, loading states, or informational messages.
 */

export default function StateMessage({ 
  children,
  icon,
  variant = 'neutral',
  className = '' 
}) {
  const variantClasses = {
    neutral: 'border-neutral-300 bg-neutral-50 text-neutral-600',
    info: 'border-info-300 bg-info-50 text-info-700',
    warning: 'border-warning-300 bg-warning-50 text-warning-700',
  }
  
  const classes = `rounded-lg border-2 border-dashed px-8 py-12 text-center ${variantClasses[variant]} ${className}`
  
  return (
    <div className={classes}>
      {icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
          {icon}
        </div>
      )}
      <div className="text-sm">{children}</div>
    </div>
  )
}

