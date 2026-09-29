// Error utility for consistent error handling across the application

export function isMeaningfulMessage(msg) {
  if (!msg || typeof msg !== "string") return false;
  const trimmed = msg.trim();
  if (!trimmed) return false;
  if (/^\d{3}(\s+[A-Za-z\s]+)?$/.test(trimmed)) return false; // e.g. "400", "400 Bad Request", "500 Internal Server Error"
  const generic = [
    "error",
    "unknown error occurred",
    "bad request",
    "internal server error",
    "unauthorized",
    "forbidden",
    "not found",
    "conflict",
    "failed to fetch",
    "[object object]",
  ];
  if (generic.includes(trimmed.toLowerCase())) return false;
  return true;
}

export function extractBackendErrorMessage(data, fallbackMessage = null) {
  if (!data) return isMeaningfulMessage(fallbackMessage) ? fallbackMessage.trim() : null;

  if (typeof data === "string") {
    const trimmed = data.trim();
    return isMeaningfulMessage(trimmed)
      ? trimmed
      : isMeaningfulMessage(fallbackMessage)
        ? fallbackMessage.trim()
        : null;
  }

  if (typeof data === "object") {
    // 1. Validation errors map or array
    if (data.errors) {
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const joined = data.errors.join(". ");
        return data.message && !data.message.toLowerCase().includes("validation failed")
          ? `${data.message}: ${joined}`
          : joined;
      }
      if (typeof data.errors === "object" && Object.keys(data.errors).length > 0) {
        const formatted = Object.entries(data.errors)
          .map(([field, msg]) => {
            const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
            return `${capitalizedField}: ${msg}`;
          })
          .join(". ");
        return data.message && !data.message.toLowerCase().includes("validation failed")
          ? `${data.message}: ${formatted}`
          : formatted;
      }
    }

    // 2. Direct message fields
    if (isMeaningfulMessage(data.message)) {
      return data.message.trim();
    }
    if (isMeaningfulMessage(data.errorMessage)) {
      return data.errorMessage.trim();
    }
    if (isMeaningfulMessage(data.error)) {
      return data.error.trim();
    }
  }

  return isMeaningfulMessage(fallbackMessage) ? fallbackMessage.trim() : null;
}

export class AppError extends Error {
  constructor(message, statusCode = 500, userMessage = null) {
    super(message);
    this.statusCode = statusCode;
    // Prefer explicit userMessage; then meaningful message from backend; then status code default
    this.userMessage =
      userMessage ||
      (isMeaningfulMessage(message) ? message : this.getDefaultUserMessage(statusCode));
    this.name = "AppError";
  }

  getDefaultUserMessage(statusCode) {
    const messages = {
      400: "Invalid request. Please check your input and try again.",
      401: "Session expired. Please log in again.",
      403: "You don't have permission to perform this action.",
      404: "The requested resource was not found.",
      409: "This data already exists or conflict occurred.",
      429: "Too many requests. Please wait before trying again.",
      500: "Server error. Please try again later.",
      502: "Service temporarily unavailable. Please try again later.",
      503: "Service temporarily unavailable. Please try again later.",
      0: "Unable to connect. Please check your internet connection and try again.",
      408: "Request timeout. Please check your connection and try again.",
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

// Parse and handle API errors, prioritizing backend-provided error messages
export function parseApiError(error) {
  if (error instanceof AppError) {
    return error;
  }

  // Network / Connection errors
  const isNetwork =
    error.name === "TypeError" &&
    (error.message?.includes("fetch") || error.message?.includes("NetworkError"));
  if (error.message === "Network Error" || isNetwork || error.code === "ERR_NETWORK") {
    return new AppError(
      "Network error",
      0,
      "Unable to connect to the server. Please check your internet connection and try again."
    );
  }

  if (error.message?.includes("timeout") || error.code === "ECONNABORTED") {
    return new AppError(
      "Request timeout",
      408,
      "The request took too long. Please check your connection and try again."
    );
  }

  if (error.response) {
    const { status, data } = error.response;
    const backendMessage = extractBackendErrorMessage(data, error.message);

    let userMessage = null;

    if (isMeaningfulMessage(backendMessage)) {
      userMessage = backendMessage;
    } else {
      // Fallback user messages when backend did not supply a specific message
      const defaultMessages = {
        400: "Invalid request. Please check your input and try again.",
        401: "Authentication failed. Please check your credentials.",
        403: "Access denied. You do not have permission to perform this action.",
        404: "The requested resource was not found.",
        409: "This resource already exists or conflict occurred.",
        429: "Too many attempts. Please wait a few minutes before trying again.",
        500: "Server error. Please try again later.",
        502: "We could not reach the delivery or server service. Please try again.",
        503: "Service temporarily unavailable. Please try again later.",
      };
      userMessage = defaultMessages[status] || "An error occurred. Please try again.";
    }

    return new AppError(backendMessage || error.message || "API Error", status, userMessage);
  }

  const statusCode = error.statusCode || error.status || 500;
  const meaningful = isMeaningfulMessage(error.message) ? error.message : null;
  return new AppError(meaningful || "Unknown error occurred", statusCode, meaningful);
}

// Get user-friendly error message
export function getErrorMessage(error) {
  if (error instanceof AppError) {
    return error.userMessage || error.message || "An error occurred. Please try again.";
  }
  if (error instanceof Error) {
    return error.userMessage || error.message || "An error occurred. Please try again.";
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
    502: "Bad Gateway",
    503: "Service Unavailable",
    0: "Network Error",
    408: "Request Timeout",
  };
  return titles[statusCode] || "Error";
}

// Parse 2FA/TOTP specific errors, prioritizing backend error messages
export function parseTotpError(error, context = "verify") {
  if (error instanceof AppError) {
    return error;
  }

  if (error.message === "Network Error" || error.message?.includes("Network")) {
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

  if (error.response) {
    const { status, data } = error.response;
    const backendMessage = extractBackendErrorMessage(data, error.message);

    let userMessage = null;

    if (isMeaningfulMessage(backendMessage)) {
      userMessage = backendMessage;
    } else {
      if (status === 400) {
        if (context === "verify" || context === "login-verify") {
          userMessage =
            context === "login-verify"
              ? "Invalid 2FA code. Please check and try again."
              : "Invalid verification code. Please check and try again.";
        } else if (context === "setup") {
          userMessage = "Invalid setup request. Please try again.";
        } else if (context === "backup-code") {
          userMessage = "Invalid backup code. Please check and try again.";
        } else {
          userMessage = "Invalid request. Please check your input.";
        }
      } else if (status === 401) {
        userMessage = "Session expired. Please log in again.";
      } else if (status === 409) {
        userMessage =
          context === "setup"
            ? "2FA is already enabled for this account."
            : "Conflict occurred. Please try again or contact support.";
      } else if (status === 429) {
        userMessage = "Too many attempts. Please wait a few minutes before trying again.";
      } else {
        userMessage = "An error occurred. Please try again.";
      }
    }

    return new AppError(backendMessage || error.message || "TOTP Error", status, userMessage);
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
