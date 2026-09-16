// Error utility for consistent error handling
export class AppError extends Error {
  constructor(message, statusCode = 500, userMessage = null) {
    super(message);
    this.statusCode = statusCode;
    this.userMessage = userMessage || this.getDefaultUserMessage(statusCode);
    this.name = "AppError";
  }

  getDefaultUserMessage(statusCode) {
    const messages = {
      400: "Invalid request. Please check your input.",
      401: "Session expired. Please login again.",
      403: "You don't have permission to perform this action.",
      404: "The requested resource was not found.",
      409: "This data already exists. Please use different information.",
      429: "Too many requests. Please wait before trying again.",
      500: "Server error. Please try again later.",
      503: "Service temporarily unavailable. Please try again later.",
    };
    return messages[statusCode] || "An error occurred. Please try again.";
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
    };
  }
}

// Parse and handle API errors with specific error detection
export function parseApiError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error.response) {
    // HTTP error response
    const { status, data } = error.response;
    let message = data?.message || error.message;
    let userMessage = null;
    
    // Parse specific login/registration error scenarios
    if (status === 401) {
      if (message?.toLowerCase().includes("invalid credentials") || 
          message?.toLowerCase().includes("invalid email or password")) {
        userMessage = "Invalid email or password. Please check and try again.";
      } else if (message?.toLowerCase().includes("password")) {
        userMessage = "Invalid password. Please try again.";
      } else if (message?.toLowerCase().includes("not found") || 
                 message?.toLowerCase().includes("no user")) {
        userMessage = "Email not found. Please check the email address or register.";
      } else if (message?.toLowerCase().includes("not verified")) {
        userMessage = "Your email has not been verified yet. Please verify your email first.";
      } else {
        userMessage = "Authentication failed. Please check your credentials.";
      }
      return new AppError(message, 401, userMessage);
    }
    
    if (status === 409) {
      if (message?.toLowerCase().includes("already")) {
        userMessage = "This email is already registered. Please sign in or use a different email.";
      } else {
        userMessage = "This data already exists. Please use different information.";
      }
      return new AppError(message, 409, userMessage);
    }

    if (status === 400) {
      if (message?.toLowerCase().includes("invalid") || message?.toLowerCase().includes("malformed")) {
        userMessage = "Invalid input. Please check your information and try again.";
      } else if (message?.toLowerCase().includes("password")) {
        userMessage = "Password does not meet requirements. Use at least 8 characters.";
      } else if (message?.toLowerCase().includes("email")) {
        userMessage = "Please provide a valid email address.";
      } else if (message?.toLowerCase().includes("otp") || message?.toLowerCase().includes("code")) {
        userMessage = "Invalid verification code. Please check and try again.";
      } else {
        userMessage = "Invalid request. Please check your input.";
      }
      return new AppError(message, 400, userMessage);
    }

    if (status === 403) {
      userMessage = "Access denied. You may not have permission to perform this action.";
      return new AppError(message, 403, userMessage);
    }

    if (status === 404) {
      userMessage = "Resource not found. Please try again.";
      return new AppError(message, 404, userMessage);
    }

    if (status === 429) {
      userMessage = "Too many attempts. Please wait a few minutes before trying again.";
      return new AppError(message, 429, userMessage);
    }
    
    return new AppError(message, status);
  }

  if (error.message === "Network Error") {
    return new AppError(
      "Network error",
      0,
      "Unable to connect. Please check your internet connection and try again."
    );
  }

  if (error.message.includes("timeout")) {
    return new AppError(
      "Request timeout",
      408,
      "The request took too long. Please check your connection and try again."
    );
  }

  return new AppError(error.message || "Unknown error occurred", 500);
}

// Get user-friendly error message
export function getErrorMessage(error) {
  if (error instanceof AppError) {
    return error.userMessage;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An error occurred. Please try again.";
}

// Handle common error codes
export function getErrorTitle(statusCode) {
  const titles = {
    400: "Invalid Request",
    401: "Authentication Failed",
    403: "Access Denied",
    404: "Not Found",
    409: "Already Exists",
    429: "Too Many Requests",
    500: "Server Error",
    503: "Service Unavailable",
    0: "Network Error",
    408: "Request Timeout",
  };
  return titles[statusCode] || "Error";
}

// Parse 2FA/TOTP specific errors
export function parseTotpError(error, context = 'verify') {
  if (error instanceof AppError) {
    return error;
  }

  if (error.response) {
    const { status, data } = error.response;
    let message = data?.message || error.message;
    let userMessage = null;

    if (status === 400) {
      if (context === 'verify' || context === 'login-verify') {
        if (message?.toLowerCase().includes("invalid")) {
          userMessage = context === 'login-verify' 
            ? "Invalid 2FA code. Please check and try again."
            : "Invalid verification code. Please check and try again.";
        } else if (message?.toLowerCase().includes("expired")) {
          userMessage = "The code has expired. Please try again.";
        } else {
          userMessage = context === 'login-verify'
            ? "2FA verification failed. Please try again."
            : "Code verification failed. Please try again.";
        }
      } else if (context === 'setup') {
        userMessage = "Invalid setup request. Please try again.";
      } else if (context === 'backup-code') {
        if (message?.toLowerCase().includes("expired")) {
          userMessage = "The backup code has expired or been used. Please use a different code.";
        } else {
          userMessage = "Invalid backup code. Please check and try again.";
        }
      }
      return new AppError(message, 400, userMessage);
    }

    if (status === 401) {
      userMessage = "Session expired. Please log in again.";
      return new AppError(message, 401, userMessage);
    }

    if (status === 409) {
      if (context === 'setup') {
        userMessage = "2FA is already enabled for this account.";
      } else {
        userMessage = "Conflict: Please try again or contact support.";
      }
      return new AppError(message, 409, userMessage);
    }

    if (status === 429) {
      userMessage = "Too many attempts. Please wait a few minutes before trying again.";
      return new AppError(message, 429, userMessage);
    }

    return new AppError(message, status);
  }

  if (error.message?.includes("Network")) {
    return new AppError(
      "Network error",
      0,
      "Connection error. Please check your internet and try again."
    );
  }

  if (error.message?.includes("timeout")) {
    return new AppError(
      "Request timeout",
      408,
      "Request timeout. Please check your connection and try again."
    );
  }

  return new AppError(error.message || "Unknown error occurred", 500);
}

// Retry logic for failed requests
export async function retryRequest(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Only retry on network errors and 5xx errors
      const appError = parseApiError(error);
      if (appError.statusCode < 500 && appError.statusCode > 0) {
        throw error;
      }
      
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
}
