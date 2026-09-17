import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api';
import { parseApiError, getErrorMessage } from '../../utils/errorHandler';

export default function TotpVerificationPage() {
  console.log("=== TotpVerificationPage RENDER ===");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [useEmailOtp, setUseEmailOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [requestingEmailOtp, setRequestingEmailOtp] = useState(false);
  const [user, setUser] = useState(null);

  // Try to get from location.state first, then sessionStorage
  const tempToken = location.state?.tempToken || sessionStorage.getItem('totp_verify_temp_token');
  const userId = location.state?.userId || (sessionStorage.getItem('totp_verify_user_id') ? parseInt(sessionStorage.getItem('totp_verify_user_id')) : null);

  console.log("TotpVerificationPage - location.state:", location.state);
  console.log("TotpVerificationPage - sessionStorage tempToken:", sessionStorage.getItem('totp_verify_temp_token'));
  console.log("TotpVerificationPage - tempToken:", tempToken);
  console.log("TotpVerificationPage - userId:", userId);

  useEffect(() => {
    console.log("TotpVerificationPage - useEffect running, tempToken:", tempToken);
    if (!tempToken) {
      console.log("No tempToken, redirecting to /login");
      navigate('/login');
    } else {
      // Extract email from tempToken (JWT payload)
      extractEmailFromToken(tempToken);
    }
  }, [tempToken, navigate]);

  const extractEmailFromToken = (token) => {
    try {
      // Decode JWT payload (it's base64url encoded)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error("Invalid token format");
        return;
      }
      
      const payload = parts[1];
      // Add padding if needed
      const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
      const decoded = JSON.parse(atob(padded));
      
      if (decoded.sub) {
        // sub contains the email
        setUser({ email: decoded.sub });
        console.log("Extracted email from token:", decoded.sub);
      }
    } catch (err) {
      console.error("Failed to extract email from token:", err);
    }
  };

  const handleRequestEmailOtp = async () => {
    setRequestingEmailOtp(true);
    setError('');
    setMessage('');

    try {
      await api.requestTotpLoginEmailOtp(tempToken, user?.email);
      setEmailOtpSent(true);
      setUseEmailOtp(true);
      setMessage('Email OTP sent to ' + user?.email + '. Check your inbox.');
      setTotpCode('');
    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);

      if (appError.statusCode === 401) {
        userMessage = 'Session expired. Please log in again.';
      } else if (appError.statusCode === 429) {
        userMessage = 'Too many OTP requests. Please wait before trying again.';
      }

      setError(userMessage);
      console.error('Email OTP request error:', appError);
    } finally {
      setRequestingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();

    const code = emailOtp.trim();

    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await api.verifyTotpLoginEmailOtp(tempToken, code);

      // Clear sessionStorage
      sessionStorage.removeItem('totp_verify_temp_token');
      sessionStorage.removeItem('totp_verify_user_id');

      // Login successful
      login(response.accessToken);
      navigate('/');
    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);

      if (appError.statusCode === 400) {
        userMessage = 'Invalid OTP. Please check and try again.';
      } else if (appError.statusCode === 404) {
        userMessage = 'OTP not found. Please request a new one.';
      } else if (appError.statusCode === 429) {
        userMessage = 'Too many attempts. Please wait a few minutes.';
      }

      setError(userMessage);
      console.error('Email OTP verification error:', appError);
      setEmailOtp('');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    const code = useBackupCode ? backupCode.trim() : totpCode.trim();

    if (!useBackupCode && code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (useBackupCode && code.length === 0) {
      setError('Please enter your backup code');
      return;
    }

    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/auth/login/verify-totp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tempToken,
          totpCode: code,
          ipAddress: null,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Parse and handle specific TOTP verification errors
        if (response.status === 400) {
          if (errorData.message?.toLowerCase().includes("invalid")) {
            throw new Error(
              useBackupCode 
                ? "Invalid backup code. Please check and try again."
                : "Invalid 2FA code. Please check and try again."
            );
          } else if (errorData.message?.toLowerCase().includes("expired")) {
            throw new Error("The backup code has expired or been used. Please use a different code.");
          } else {
            throw new Error(
              useBackupCode 
                ? "Invalid backup code. Please try again."
                : "Invalid 2FA code. Please try again."
            );
          }
        } else if (response.status === 401) {
          throw new Error("Session expired. Please log in again.");
        } else if (response.status === 429) {
          throw new Error("Too many verification attempts. Please wait a few minutes before trying again.");
        } else if (response.status === 404) {
          throw new Error("Verification code not found. Please log in again.");
        } else {
          throw new Error(errorData.message || 'Verification failed. Please try again.');
        }
      }

      const data = await response.json();

      // Clear sessionStorage
      sessionStorage.removeItem('totp_verify_temp_token');
      sessionStorage.removeItem('totp_verify_user_id');

      // Success! Store token and redirect
      login(data.accessToken);
      navigate('/');
    } catch (err) {
      const errorMessage = err.message || 'Verification failed. Please try again.';
      setError(errorMessage);
      console.error("TOTP verification error:", err);
      
      // Clear input on error
      if (useBackupCode) {
        setBackupCode('');
      } else {
        setTotpCode('');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setTotpCode(value);
      setError('');
    }
  };

  const handleBackupCodeChange = (e) => {
    setBackupCode(e.target.value);
    setError('');
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setError('');
    setMessage('');
    setTotpCode('');
    setBackupCode('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
          <p className="text-gray-600 text-sm">
            {useBackupCode 
              ? 'Enter one of your backup codes'
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm" role="status">
            {message}
          </div>
        )}

        <form onSubmit={useEmailOtp && emailOtpSent ? handleVerifyEmailOtp : handleVerify}>
          {useEmailOtp && emailOtpSent ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email OTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={emailOtp}
                onChange={(e) => {
                  setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                disabled={verifying}
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Check your email for the verification code
              </p>
            </div>
          ) : !useBackupCode ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={totpCode}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                disabled={verifying}
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                The code changes every 30 seconds
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={handleBackupCodeChange}
                placeholder="XXXX-XXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg tracking-wider font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                disabled={verifying}
              />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Backup codes can only be used once
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={verifying || (useEmailOtp && emailOtpSent && emailOtp.length !== 6) || (!useEmailOtp && !useBackupCode && totpCode.length !== 6) || (!useEmailOtp && useBackupCode && backupCode.length === 0)}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
          >
            {verifying ? 'Verifying...' : useEmailOtp && emailOtpSent ? 'Verify & Sign In' : 'Verify & Sign In'}
          </button>

          {/* Toggle Options */}
          {!useEmailOtp && (
            <>
              <button
                type="button"
                onClick={toggleBackupCode}
                className="w-full text-sm text-indigo-600 hover:text-indigo-700 underline mb-2"
              >
                {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
              </button>
              <button
                type="button"
                onClick={handleRequestEmailOtp}
                disabled={requestingEmailOtp || !user}
                className="w-full text-sm text-indigo-600 hover:text-indigo-700 underline"
              >
                {requestingEmailOtp ? 'Sending email...' : "Can't access your authenticator app?"}
              </button>
            </>
          )}

          {/* Back from Email OTP */}
          {useEmailOtp && emailOtpSent && (
            <button
              type="button"
              onClick={() => {
                setUseEmailOtp(false);
                setEmailOtp('');
                setEmailOtpSent(false);
                setError('');
                setMessage('');
              }}
              className="w-full text-sm text-indigo-600 hover:text-indigo-700 underline"
            >
              ← Back to authenticator code
            </button>
          )}
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to login
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Lost access to your authenticator? Contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
