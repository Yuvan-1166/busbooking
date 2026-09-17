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
  const [user, setUser] = useState(null);
  
  // Phase management: 'totp' | 'alternatives' | 'alternative-verify'
  const [phase, setPhase] = useState('totp');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [alternativeOtp, setAlternativeOtp] = useState('');
  const [alternativeSession, setAlternativeSession] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

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

  // Countdown timer for alternative OTP expiration
  useEffect(() => {
    if (phase !== 'alternative-verify' || !alternativeSession) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - alternativeSession.createdAt) / 1000;
      const remaining = Math.max(0, alternativeSession.expiresIn - elapsed);
      setCountdown(Math.ceil(remaining));

      if (remaining <= 0) {
        setError('OTP has expired. Please request a new one.');
        setPhase('alternatives');
        setAlternativeSession(null);
        setAlternativeOtp('');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, alternativeSession]);

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

  const handleShowAlternatives = () => {
    setPhase('alternatives');
    setError('');
    setMessage('');
  };

  const handleSelectAlternative = async (method) => {
    setSendingOtp(true);
    setError('');
    setMessage('');

    try {
      const response = await api.sendTotpAlternativeOtp(method, tempToken);
      
      setSelectedMethod(method);
      setAlternativeSession({
        sessionId: response.sessionId,
        maskedRecipient: response.maskedRecipient,
        expiresIn: response.expiresIn,
        createdAt: Date.now()
      });
      setPhase('alternative-verify');
      setAlternativeOtp('');
      setCountdown(response.expiresIn);
      setMessage(`OTP sent to ${response.maskedRecipient}`);
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
      setSendingOtp(false);
    }
  };

  const handleVerifyAlternativeOtp = async (e) => {
    e.preventDefault();

    if (alternativeOtp.length < 4 || alternativeOtp.length > 6) {
      setError('Please enter a valid 4-6 digit code');
      return;
    }

    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const response = await api.verifyTotpAlternativeOtp(
        tempToken,
        alternativeSession.sessionId,
        alternativeOtp
      );

      setMessage('OTP verified successfully!');
      
      // Clear sessionStorage
      sessionStorage.removeItem('totp_verify_temp_token');
      sessionStorage.removeItem('totp_verify_user_id');

      // Login successful
      setTimeout(() => {
        login(response.accessToken);
        navigate('/');
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
      setAlternativeOtp('');
      console.error('OTP verification failed:', appError);
    } finally {
      setVerifying(false);
    }
  };

  const handleBackToTotp = () => {
    setPhase('totp');
    setError('');
    setMessage('');
    setAlternativeOtp('');
    setAlternativeSession(null);
    setSelectedMethod(null);
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

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="mx-auto mb-[100px] mt-[55px] max-w-[520px] px-4">
      <section className="border border-[#e7e5dc] bg-paper p-7">
        <p className="mb-4 font-mono text-[10px] tracking-[.13em] text-green">
          SIGN IN
        </p>
        <h1 className="mb-2 font-display text-[28px] font-semibold leading-tight text-ink">
          {phase === 'totp' && "Two-Factor Authentication"}
          {phase === 'alternatives' && "Choose Verification Method"}
          {phase === 'alternative-verify' && "Verify Code"}
        </h1>
        <p className="mb-6 text-sm text-muted leading-6">
          {phase === 'totp' && (useBackupCode 
            ? 'Enter one of your backup codes to complete sign in.'
            : 'Enter the 6-digit code from your authenticator app to complete sign in.'
          )}
          {phase === 'alternatives' && 'Choose how to receive your verification code.'}
          {phase === 'alternative-verify' && `Enter the code sent to ${alternativeSession?.maskedRecipient}`}
        </p>

        {error && (
          <div
            className="mb-5 border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]"
            role="alert"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            className="mb-5 border border-[#a5bea0] bg-[#e4eee1] px-4 py-3 text-xs text-green"
            role="status"
          >
            {message}
          </div>
        )}

        {/* PHASE 1: TOTP or Backup Code */}
        {phase === 'totp' && (
          <form onSubmit={handleVerify} className="grid gap-5">
            {!useBackupCode ? (
              <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
                <span>6-digit code</span>
                <input
                  type="text"
                  value={totpCode}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full border-0 border-b border-line bg-transparent py-2.5 text-center text-2xl text-ink outline-0 font-mono tracking-widest focus:border-orange"
                  autoFocus
                  disabled={verifying}
                />
              </label>
            ) : (
              <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
                <span>Backup code</span>
                <input
                  type="text"
                  value={backupCode}
                  onChange={handleBackupCodeChange}
                  placeholder="XXXX-XXXX"
                  className="w-full border-0 border-b border-line bg-transparent py-2.5 text-center text-lg text-ink outline-0 font-mono tracking-wider focus:border-orange"
                  autoFocus
                  disabled={verifying}
                />
              </label>
            )}

            <button
              type="submit"
              disabled={verifying || (!useBackupCode && totpCode.length !== 6) || (useBackupCode && backupCode.length === 0)}
              className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
            >
              {verifying ? "Verifying…" : "Verify & Sign In"}
              <span className="float-right text-lg">→</span>
            </button>

            {/* Toggle Options */}
            <button
              type="button"
              onClick={toggleBackupCode}
              className="bg-transparent p-0 text-[11px] text-orange"
            >
              {useBackupCode ? "Use authenticator code instead" : "Use backup code instead"}
            </button>
            <button
              type="button"
              onClick={handleShowAlternatives}
              className="bg-transparent p-0 text-[11px] text-orange"
            >
              Can't access your authenticator app?
            </button>
          </form>
        )}

        {/* PHASE 2: Alternative Method Selection */}
        {phase === 'alternatives' && (
          <div className="grid gap-3">
            {/* SMS Method */}
            <button
              onClick={() => handleSelectAlternative('SMS')}
              disabled={sendingOtp}
              className="grid gap-2 border border-line bg-[#f9f8f5] p-4 text-left disabled:opacity-45 hover:border-orange hover:bg-[#fff6ee]"
            >
              <strong className="font-display text-sm text-ink">SMS Code</strong>
              <span className="text-xs text-muted">Receive a code via text message</span>
            </button>

            {/* Email Method */}
            <button
              onClick={() => handleSelectAlternative('EMAIL')}
              disabled={sendingOtp}
              className="grid gap-2 border border-line bg-[#f9f8f5] p-4 text-left disabled:opacity-45 hover:border-orange hover:bg-[#fff6ee]"
            >
              <strong className="font-display text-sm text-ink">Email Code</strong>
              <span className="text-xs text-muted">Receive a code via email</span>
            </button>

            {sendingOtp && (
              <div className="border border-dashed border-line p-6 text-center">
                <p className="text-xs text-muted">Sending verification code…</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleBackToTotp}
              disabled={sendingOtp}
              className="bg-transparent p-0 text-[11px] text-orange"
            >
              ← Back to authenticator app
            </button>
          </div>
        )}

        {/* PHASE 3: Alternative OTP Verification */}
        {phase === 'alternative-verify' && (
          <form onSubmit={handleVerifyAlternativeOtp} className="grid gap-5">
            <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
              <span>Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{4,6}"
                maxLength={6}
                value={alternativeOtp}
                onChange={(e) => {
                  setAlternativeOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError("");
                }}
                placeholder="000000"
                className="w-full border-0 border-b border-line bg-transparent py-2.5 text-center text-2xl text-ink outline-0 font-mono tracking-widest focus:border-orange"
                autoFocus
                disabled={verifying}
              />
              <span className="text-[9px] text-muted">Code expires in {formatCountdown(countdown)}</span>
            </label>

            <button
              type="submit"
              disabled={verifying || alternativeOtp.length < 4}
              className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
            >
              {verifying ? "Verifying…" : "Verify Code"}
              <span className="float-right text-lg">→</span>
            </button>

            <button
              type="button"
              onClick={() => setPhase('alternatives')}
              disabled={verifying}
              className="border-0 border-b border-orange bg-transparent p-0 text-[11px] text-orange"
            >
              ← Try another method
            </button>
          </form>
        )}

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
        <div className="mt-6 border-t border-line pt-4 text-[10px] text-muted">
          <p>
            Lost access to your authenticator? Contact support for assistance or use a backup code if available.
          </p>
        </div>
      </section>
    </main>
  );
}
