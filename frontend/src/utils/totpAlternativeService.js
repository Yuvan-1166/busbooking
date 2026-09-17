/**
 * Utility service for TOTP alternative authentication methods
 * Handles SMS, Email, and other OTP delivery methods during login fallback
 * 
 * This service provides:
 * - Coordinated OTP sending and verification
 * - Rate limiting awareness
 * - Session management for alternative OTP flows
 * - Error handling and user feedback
 */

/**
 * Alternative OTP method types
 */
export const OtpAlternativeMethod = {
  SMS: 'SMS',
  EMAIL: 'EMAIL',
  BACKUP_CODE: 'BACKUP_CODE',
};

/**
 * OTP status tracking
 */
export const OtpStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED',
};

/**
 * Session state for alternative OTP flow
 */
export class TotpAlternativeSession {
  constructor() {
    this.method = null;
    this.sessionId = null;
    this.maskedRecipient = null;
    this.expiresIn = null;
    this.createdAt = null;
    this.attemptCount = 0;
  }

  isExpired() {
    if (!this.createdAt || !this.expiresIn) return false;
    const now = Date.now();
    const sessionAge = now - this.createdAt; // in ms
    return sessionAge > this.expiresIn * 1000; // convert expiresIn to ms
  }

  toJSON() {
    return {
      method: this.method,
      sessionId: this.sessionId,
      maskedRecipient: this.maskedRecipient,
      expiresIn: this.expiresIn,
      createdAt: this.createdAt,
      attemptCount: this.attemptCount,
    };
  }

  static fromJSON(data) {
    const session = new TotpAlternativeSession();
    Object.assign(session, data);
    return session;
  }
}

/**
 * Service class for managing TOTP alternative authentication
 */
export class TotpAlternativeService {
  constructor(api) {
    this.api = api;
    this.session = null;
  }

  /**
   * Send alternative OTP to user
   * 
   * @param {string} method - OTP method (SMS, EMAIL, etc.)
   * @param {string} tempToken - Temporary JWT token from initial login
   * @returns {Promise<TotpAlternativeSession>} Session info with masked recipient
   */
  async sendOtp(method, tempToken) {
    try {
      const response = await this.api.sendTotpAlternativeOtp(method, tempToken);

      // Create session object
      this.session = new TotpAlternativeSession();
      this.session.method = response.method;
      this.session.sessionId = response.sessionId;
      this.session.maskedRecipient = response.maskedRecipient;
      this.session.expiresIn = response.expiresIn;
      this.session.createdAt = Date.now();
      this.session.attemptCount = 0;

      // Store session in session storage for recovery
      sessionStorage.setItem('totp_alternative_session', JSON.stringify(this.session.toJSON()));

      return this.session;
    } catch (error) {
      console.error('Failed to send alternative OTP:', error);
      this.clearSession();
      throw error;
    }
  }

  /**
   * Verify alternative OTP code
   * 
   * @param {string} code - OTP code entered by user
   * @param {string} tempToken - Temporary JWT token
   * @returns {Promise<{accessToken: string}>} Authentication response
   */
  async verifyOtp(code, tempToken) {
    if (!this.session || !this.session.sessionId) {
      throw new Error('No active OTP session. Please request OTP first.');
    }

    if (this.session.isExpired()) {
      this.clearSession();
      throw new Error('OTP session has expired. Please request a new OTP.');
    }

    try {
      const response = await this.api.verifyTotpAlternativeOtp(
        tempToken,
        this.session.sessionId,
        code
      );

      // Mark as verified and clear session
      this.session.status = OtpStatus.VERIFIED;
      this.clearSession();

      return response;
    } catch (error) {
      this.session.attemptCount++;

      // Check if we've exceeded max attempts
      if (error.message && error.message.includes('Too many')) {
        this.clearSession();
        throw new Error('Too many verification attempts. Please request a new OTP.');
      }

      // Store updated session
      sessionStorage.setItem('totp_alternative_session', JSON.stringify(this.session.toJSON()));

      console.error('Failed to verify alternative OTP:', error);
      throw error;
    }
  }

  /**
   * Get current session info
   * 
   * @returns {TotpAlternativeSession|null} Current session or null if none
   */
  getSession() {
    return this.session;
  }

  /**
   * Load session from storage (for recovery after page refresh)
   * 
   * @returns {TotpAlternativeSession|null} Loaded session or null
   */
  loadSession() {
    try {
      const stored = sessionStorage.getItem('totp_alternative_session');
      if (stored) {
        this.session = TotpAlternativeSession.fromJSON(JSON.parse(stored));
        return this.session;
      }
    } catch (error) {
      console.warn('Failed to load alternative session:', error);
    }
    return null;
  }

  /**
   * Clear current session
   */
  clearSession() {
    this.session = null;
    sessionStorage.removeItem('totp_alternative_session');
  }

  /**
   * Get remaining time for OTP validity
   * 
   * @returns {number} Remaining seconds (0 if expired)
   */
  getRemainingTime() {
    if (!this.session || !this.session.createdAt || !this.session.expiresIn) {
      return 0;
    }

    const elapsed = (Date.now() - this.session.createdAt) / 1000; // in seconds
    const remaining = Math.max(0, this.session.expiresIn - elapsed);
    return remaining;
  }

  /**
   * Check if OTP session is still valid
   * 
   * @returns {boolean} true if session exists and not expired
   */
  isSessionValid() {
    return this.session && !this.session.isExpired();
  }

  /**
   * Get user-friendly message for method
   * 
   * @param {string} method - OTP method
   * @returns {string} Display message
   */
  static getMethodDisplayName(method) {
    switch (method) {
      case OtpAlternativeMethod.SMS:
        return 'SMS';
      case OtpAlternativeMethod.EMAIL:
        return 'Email';
      case OtpAlternativeMethod.BACKUP_CODE:
        return 'Backup Code';
      default:
        return method;
    }
  }

  /**
   * Get icon for method
   * 
   * @param {string} method - OTP method
   * @returns {string} Icon name or emoji
   */
  static getMethodIcon(method) {
    switch (method) {
      case OtpAlternativeMethod.SMS:
        return '📱';
      case OtpAlternativeMethod.EMAIL:
        return '📧';
      case OtpAlternativeMethod.BACKUP_CODE:
        return '🔑';
      default:
        return '🔐';
    }
  }

  /**
   * Validate OTP code format
   * 
   * @param {string} code - OTP code to validate
   * @returns {boolean} true if valid format
   */
  static isValidOtpFormat(code) {
    // OTP should be 4-6 digits
    return /^\d{4,6}$/.test(code);
  }
}

export default TotpAlternativeService;
