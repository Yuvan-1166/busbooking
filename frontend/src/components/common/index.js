/**
 * Common Components Library
 * 
 * Export all reusable components from a single entry point.
 * This makes imports cleaner and more maintainable.
 * 
 * Usage:
 * import { Button, Card, Alert } from '@/components/common'
 */

// Core Components
export { default as Button } from './Button'
export { default as Badge } from './Badge'
export { default as Alert } from './Alert'

// Layout Components
export { 
  default as Card, 
  CardHeader, 
  CardTitle, 
  CardBody, 
  CardFooter 
} from './Card'

// Form Components
export { 
  default as Input, 
  Textarea, 
  Select 
} from './Input'

// Feedback Components
export { default as Modal } from './Modal'
export { default as RightDrawer } from './RightDrawer'
export { default as StateMessage } from './StateMessage'
export { default as Pagination } from './Pagination'

// Loading Components
export { 
  default as LoadingPage,
  Spinner,
  LoadingOverlay,
  InlineLoader,
  Skeleton,
  SkeletonCard,
  SkeletonText
} from './Loading'

// Utility Components
export { default as ErrorBoundary } from './ErrorBoundary'
export { default as DualRangeSlider } from './DualRangeSlider'
