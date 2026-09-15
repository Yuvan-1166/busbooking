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
    
    // Parse specific error scenarios from backend messages
    if (status === 409 && message?.toLowerCase().includes("already")) {
      return new AppError(message, 409, "This email is already registered. Please sign in or use a different email.");
    }
    if (status === 400 && message?.toLowerCase().includes("invalid")) {
      return new AppError(message, 400, "Invalid input. Please check your information.");
    }
    if (status === 401 && message?.toLowerCase().includes("password")) {
      return new AppError(message, 401, "Invalid email or password.");
    }
    
    return new AppError(message, status);
  }

  if (error.message === "Network Error") {
    return new AppError(
      "Network error",
      0,
      "Unable to connect. Please check your internet connection."
    );
  }

  if (error.message.includes("timeout")) {
    return new AppError(
      "Request timeout",
      408,
      "The request took too long. Please try again."
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
