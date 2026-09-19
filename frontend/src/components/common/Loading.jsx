/**
 * Loading Components
 * 
 * Reusable loading indicators including spinners and skeletons.
 */

/**
 * Spinner Component
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }
  
  return (
    <div className={`spinner ${sizeClasses[size]} ${className}`}></div>
  )
}

/**
 * LoadingOverlay Component
 * Full-screen or contained loading overlay
 */
export function LoadingOverlay({ 
  message = 'Loading...', 
  fullScreen = false,
  className = '' 
}) {
  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 bg-white/80 backdrop-blur-sm' 
    : 'absolute inset-0 bg-white/80'
  
  return (
    <div className={`${containerClass} flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        {message && (
          <p className="text-neutral-600">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Skeleton Component
 * For shimmer loading states
 */
export function Skeleton({ 
  width = 'full',
  height = '4',
  className = '',
  circle = false,
  count = 1,
}) {
  const widthClasses = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4',
  }
  
  const heightClass = `h-${height}`
  const shapeClass = circle ? 'rounded-full' : 'rounded'
  const baseClasses = `skeleton ${widthClasses[width] || width} ${heightClass} ${shapeClass} ${className}`
  
  if (count === 1) {
    return <div className={baseClasses}></div>
  }
  
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={baseClasses}></div>
      ))}
    </div>
  )
}

/**
 * SkeletonCard Component
 * Pre-built skeleton for card layouts
 */
export function SkeletonCard() {
  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton width="12" height="12" circle />
        <div className="flex-1 space-y-2">
          <Skeleton width="3/4" height="4" />
          <Skeleton width="1/2" height="3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton count={3} />
      </div>
    </div>
  )
}

/**
 * SkeletonText Component
 * Pre-built skeleton for text content
 */
export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '2/3' : 'full'} 
          height="4" 
        />
      ))}
    </div>
  )
}

export default Spinner
