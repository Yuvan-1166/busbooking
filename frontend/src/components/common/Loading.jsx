/**
 * Professional Loading Components
 * 
 * Standard, consistent loading states for the entire application.
 */

/**
 * Spinner Component
 * Clean, professional spinner with consistent sizing
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
 * LoadingPage Component
 * Standard full-page loading screen for the entire application
 */
export function LoadingPage({ 
  message = 'Loading...',
  subMessage = 'Please wait while we prepare your experience',
  showLogo = true 
}) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        
        {/* Logo */}
        {showLogo && (
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
              <svg className="h-9 w-9" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6zm2-7h12a2 2 0 012 2v1H4V6a2 2 0 012-2z"/>
                <circle cx="6" cy="19" r="1"/>
                <circle cx="18" cy="19" r="1"/>
                <rect x="7" y="8" width="2" height="2" rx="0.5"/>
                <rect x="11" y="8" width="2" height="2" rx="0.5"/>
                <rect x="15" y="8" width="2" height="2" rx="0.5"/>
              </svg>
            </div>
          </div>
        )}
        
        {/* Loading Spinner */}
        <div className="mb-6 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-500"></div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-900">{message}</h2>
          <p className="text-neutral-600">{subMessage}</p>
        </div>
        
        {/* Loading Dots Animation */}
        <div className="mt-6 flex justify-center gap-1">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary-400 [animation-delay:0ms]"></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary-400 [animation-delay:150ms]"></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary-400 [animation-delay:300ms]"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * LoadingOverlay Component
 * For overlay loading states within sections
 */
export function LoadingOverlay({ 
  message = 'Loading...', 
  fullScreen = false,
  className = '' 
}) {
  const containerClass = fullScreen 
    ? 'fixed inset-0 z-50 bg-white/95 backdrop-blur-sm' 
    : 'absolute inset-0 bg-white/95 backdrop-blur-sm'
  
  return (
    <div className={`${containerClass} flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-neutral-200 border-t-primary-500"></div>
        </div>
        {message && (
          <p className="text-neutral-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  )
}

/**
 * InlineLoader Component  
 * Small loading state for buttons and inline elements
 */
export function InlineLoader({ size = 'sm', message = '', className = '' }) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-5 w-5',
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`}></div>
      {message && <span className="text-sm">{message}</span>}
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

// Export LoadingPage as default for main loading screen
export default LoadingPage
