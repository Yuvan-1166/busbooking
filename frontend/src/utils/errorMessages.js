/**
 * Maps technical error messages to user-friendly messages
 * @param {string} errorMessage - The raw error message from API
 * @param {string} context - The context where error occurred (e.g., 'send-otp', 'verify-otp')
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyErrorMessage(errorMessage, context = '') {
  if (!errorMessage) return 'An unexpected error occurred. Please try again.'

  const lowerError = errorMessage.toLowerCase()

  // Network errors
  if (lowerError.includes('failed to fetch') || lowerError.includes('network')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.'
  }

  // Authentication errors
  if (lowerError.includes('unauthorized') || lowerError.includes('401')) {
    return 'Your session has expired. Please log in again.'
  }

  if (lowerError.includes('forbidden') || lowerError.includes('403')) {
    return 'You do not have permission to perform this action.'
  }

  // Mobile verification specific errors
  if (context === 'send-otp') {
    if (lowerError.includes('invalid') && lowerError.includes('mobile')) {
      return 'Invalid mobile number. Please enter a valid 10-digit number.'
    }
    if (lowerError.includes('rate limit') || lowerError.includes('too many')) {
      return 'Too many OTP requests. Please wait a few minutes and try again.'
    }
    if (lowerError.includes('sms') || lowerError.includes('delivery')) {
      return 'Unable to send SMS. Please verify your mobile number and try again.'
    }
    if (lowerError.includes('credits') || lowerError.includes('balance')) {
      return 'Service temporarily unavailable. Please try again later.'
    }
    return 'Failed to send OTP. Please verify your mobile number and try again.'
  }

  if (context === 'verify-otp') {
    if (lowerError.includes('invalid') || lowerError.includes('incorrect')) {
      return 'Invalid OTP code. Please check the code and try again.'
    }
    if (lowerError.includes('expired')) {
      return 'OTP has expired. Please request a new code.'
    }
    if (lowerError.includes('used') || lowerError.includes('already')) {
      return 'This OTP has already been used. Please request a new code.'
    }
    if (lowerError.includes('verification_failed')) {
      return 'Verification failed. Please check your OTP and try again.'
    }
    return 'Failed to verify OTP. Please try again.'
  }

  if (context === 'update-verification') {
    if (lowerError.includes('already verified')) {
      return 'Your mobile number is already verified.'
    }
    if (lowerError.includes('not found')) {
      return 'User information not found. Please log in again.'
    }
    return 'Failed to update verification status. Please try again.'
  }

  // Validation errors
  if (lowerError.includes('validation') || lowerError.includes('invalid')) {
    // Try to extract field-specific message
    if (lowerError.includes('mobile') || lowerError.includes('phone')) {
      return 'Invalid mobile number format. Please enter a valid 10-digit number.'
    }
    if (lowerError.includes('otp') || lowerError.includes('code')) {
      return 'Invalid OTP format. Please enter a valid code.'
    }
    return 'Invalid input. Please check your information and try again.'
  }

  // Server errors
  if (lowerError.includes('500') || lowerError.includes('internal server')) {
    return 'A server error occurred. Please try again in a few moments.'
  }

  if (lowerError.includes('503') || lowerError.includes('unavailable')) {
    return 'Service temporarily unavailable. Please try again later.'
  }

  if (lowerError.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.'
  }

  // If message is already user-friendly (no technical jargon), return as is
  if (!lowerError.includes('exception') && 
      !lowerError.includes('null') && 
      !lowerError.includes('undefined') &&
      !lowerError.includes('error:') &&
      errorMessage.length < 200) {
    return errorMessage
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again later.'
}

/**
 * Formats validation errors into a readable message
 * @param {Object|Array|string} errors - Validation errors
 * @returns {string} Formatted error message
 */
export function formatValidationErrors(errors) {
  if (!errors) return ''

  if (typeof errors === 'string') return errors

  if (Array.isArray(errors)) {
    return errors.join('. ')
  }

  if (typeof errors === 'object') {
    return Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('. ')
  }

  return 'Validation failed. Please check your input.'
}
