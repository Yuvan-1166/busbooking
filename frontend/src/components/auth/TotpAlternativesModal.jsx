import { useState, useEffect } from 'react';
import { api } from '../../api';
import { parseApiError, getErrorMessage } from '../../utils/errorHandler';
import TotpAlternativeService from '../../utils/totpAlternativeService';

/**
 * Modal component for selecting and using alternative OTP methods during TOTP login
 * Provides SMS and Email options when the authenticator app is unavailable
 * 
 * Props:
 * - isOpen: boolean - Whether modal is visible
 * - onClose: function - Callback to close modal
 * - onVerified: function - Callback when OTP is successfully verified
 * - tempToken: string - Temporary JWT token from initial login
 * - user: object - User info (contains email)
 */
export default function TotpAlternativesModal({
  isOpen,
  onClose,
  onVerified,
  tempToken,
  user,
}) {
  const [service] = useState(() => new TotpAlternativeService(api));
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState('select'); // 'select', 'enter-otp'
  const [session, setSession] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear session on unmount - user might need it after modal closes
    };
  }, []);

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (phase !== 'enter-otp' || !session) return;

    const interval = setInterval(() => {
      const remaining = service.getRemainingTime();
      setCountdown(Math.ceil(remaining));

      if (remaining <= 0) {
        setError('OTP has expired. Please request a new one.');
        setPhase('select');
        service.clearSession();
        setSession(null);
        setOtpCode('');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, session, service]);

  const handleMethodSelect = async (method) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const newSession = await service.sendOtp(method, tempToken);
      setSelectedMethod(method);
      setSession(newSession);
      setPhase('enter-otp');
      setOtpCode('');

      // Set initial countdown
      setCountdown(Math.ceil(service.getRemainingTime()));

      setMessage(`OTP sent to ${newSession.maskedRecipient}`);
    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);

      if (appError.statusCode === 429) {
        userMessage = 'Too many requests. Please wait before trying again.';
      } else if (appError.statusCode === 400) {
        userMessage = err.message || 'Unable to send OTP to this method.';
      }

      setError(userMessage);
      console.error('Failed to send alternative OTP:', appError);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtpCode(value);
      setError('');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!TotpAlternativeService.isValidOtpFormat(otpCode)) {
      setError('Please enter a valid 4-6 digit code');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await service.verifyOtp(otpCode, tempToken);

      setMessage('OTP verified successfully!');
      
      // Call the parent's callback with the access token
      setTimeout(() => {
        onVerified(response.accessToken);
      }, 500);

    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);

      if (appError.statusCode === 400) {
        userMessage = 'Invalid OTP code. Please check and try again.';
      } else if (appError.statusCode === 429) {
        userMessage = 'Too many verification attempts. Please request a new OTP.';
      }

      setError(userMessage);
      setOtpCode('');
      console.error('OTP verification failed:', appError);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMethods = () => {
    setPhase('select');
    setSelectedMethod(null);
    setOtpCode('');
    setError('');
    setMessage('');
    service.clearSession();
    setSession(null);
    setCountdown(0);
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Verify Your Identity</h2>
              <p className="text-indigo-100 text-sm mt-1">
                {phase === 'select' 
                  ? 'Choose how to receive your verification code' 
                  : `Enter the code sent to ${session?.maskedRecipient}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-start">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-start">
              <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}

          {phase === 'select' ? (
            // Method Selection Phase
            <div className="space-y-3">
              {/* SMS Method */}
              <button
                onClick={() => handleMethodSelect('SMS')}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📱</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">SMS Code</h3>
                    <p className="text-sm text-gray-600">Receive a code via text message</p>
                  </div>
                </div>
              </button>

              {/* Email Method */}
              <button
                onClick={() => handleMethodSelect('EMAIL')}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📧</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Code</h3>
                    <p className="text-sm text-gray-600">Receive a code via email</p>
                  </div>
                </div>
              </button>

              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m0 0h6" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">Sending verification code...</p>
                </div>
              )}
            </div>
          ) : (
            // OTP Entry Phase
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  maxLength={6}
                  value={otpCode}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Code expires in {formatCountdown(countdown)}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={handleBackToMethods}
                disabled={loading}
                className="w-full text-indigo-600 hover:text-indigo-700 text-sm font-medium py-2"
              >
                ← Try another method
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t px-6 py-4">
          <p className="text-xs text-gray-600 text-center">
            Didn't receive a code? Check your spam folder or try another method.
          </p>
        </div>
      </div>
    </div>
  );
}
