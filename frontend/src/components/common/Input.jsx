/**
 * Input Component
 * 
 * A reusable input component that follows the design system.
 * Supports labels, hints, errors, and icons.
 */

export default function Input({ 
  label,
  hint,
  error,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
  ...props 
}) {
  const widthClass = fullWidth ? 'w-full' : ''
  const errorClass = error ? 'border-error-500 focus:ring-error-500' : ''
  const inputClasses = `input ${widthClass} ${errorClass} ${className}`
  
  const InputElement = (
    <input className={inputClasses} {...props} />
  )
  
  if (!label && !hint && !error) {
    return InputElement
  }
  
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      {hint && !error && (
        <p className="form-hint">{hint}</p>
      )}
      {InputElement}
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  )
}

/**
 * Textarea Component
 */
export function Textarea({ 
  label,
  hint,
  error,
  fullWidth = true,
  className = '',
  rows = 4,
  ...props 
}) {
  const widthClass = fullWidth ? 'w-full' : ''
  const errorClass = error ? 'border-error-500 focus:ring-error-500' : ''
  const textareaClasses = `input resize-y ${widthClass} ${errorClass} ${className}`
  
  const TextareaElement = (
    <textarea className={textareaClasses} rows={rows} {...props} />
  )
  
  if (!label && !hint && !error) {
    return TextareaElement
  }
  
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      {hint && !error && (
        <p className="form-hint">{hint}</p>
      )}
      {TextareaElement}
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  )
}

/**
 * Select Component
 */
export function Select({ 
  label,
  hint,
  error,
  fullWidth = true,
  className = '',
  children,
  ...props 
}) {
  const widthClass = fullWidth ? 'w-full' : ''
  const errorClass = error ? 'border-error-500 focus:ring-error-500' : ''
  const selectClasses = `select ${widthClass} ${errorClass} ${className}`
  
  const SelectElement = (
    <select className={selectClasses} {...props}>
      {children}
    </select>
  )
  
  if (!label && !hint && !error) {
    return SelectElement
  }
  
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="text-error-600 ml-1">*</span>}
        </label>
      )}
      {hint && !error && (
        <p className="form-hint">{hint}</p>
      )}
      {SelectElement}
      {error && (
        <p className="form-error">{error}</p>
      )}
    </div>
  )
}
