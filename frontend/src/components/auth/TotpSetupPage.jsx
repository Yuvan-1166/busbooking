import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { parseApiError, getErrorMessage } from '../../utils/errorHandler';
import BackupCodesModal from './BackupCodesModal';

export default function TotpSetupPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!session) {
      navigate('/login');
      return;
    }

    fetchSetupData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSetupData = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      // Call the backend endpoint to generate TOTP secret and QR code
      // This now uses the regular JWT token from the session
      const data = await api.setupTotp();
      setSetupData(data);
    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);

      // Handle specific setup errors
      if (appError.statusCode === 400) {
        userMessage = "Invalid setup request. Please try again.";
      } else if (appError.statusCode === 401) {
        userMessage = "Session expired. Please log in again.";
        setTimeout(() => navigate('/login'), 2000);
      } else if (appError.statusCode === 409) {
        userMessage = "2FA is already enabled for this account.";
      } else if (appError.statusCode === 0) {
        userMessage = "Connection error. Please check your internet and try again.";
      } else if (appError.statusCode === 408) {
        userMessage = "Request timeout. Please check your connection and try again.";
      }

      setError(userMessage);
      console.error("TOTP setup fetch error:", appError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (totpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');
    setMessage('');

    try {
      // Use the api helper with regular JWT token
      await api.verifyTotpSetup(totpCode);

      // 2FA enabled successfully! Now generate and show backup codes
      setMessage('2FA enabled successfully! Generating backup codes...');
      setTotpCode('');
      
      // Generate backup codes
      await handleGenerateBackupCodes();
      
      // Show backup codes modal
      setShowBackupCodesModal(true);
    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);

      // Handle specific verification errors
      if (appError.statusCode === 400) {
        if (err.response?.data?.message?.toLowerCase().includes("invalid")) {
          userMessage = "Invalid 2FA code. Please check and try again.";
        } else {
          userMessage = "The code you entered is incorrect. Please try again.";
        }
      } else if (appError.statusCode === 401) {
        userMessage = "Session expired. Please log in again.";
      } else if (appError.statusCode === 409) {
        userMessage = "2FA is already enabled. Please disable it first if you want to re-enable.";
      } else if (appError.statusCode === 429) {
        userMessage = "Too many verification attempts. Please wait a few minutes before trying again.";
      } else if (appError.statusCode === 0) {
        userMessage = "Connection error. Please check your internet and try again.";
      } else if (appError.statusCode === 408) {
        userMessage = "Request timeout. Please check your connection and try again.";
      }

      setError(userMessage);
      console.error("TOTP verification error:", appError);
      setTotpCode('');
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    try {
      const response = await api.generateBackupCodes();
      setBackupCodes(response.codes || response.plainCodes || []);
      return response;
    } catch (err) {
      const appError = parseApiError(err);
      console.error("Backup codes generation error:", appError);
      throw err;
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setTotpCode(value);
      setError('');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto my-[55px] max-w-[520px] px-4">
        <div className="border border-dashed border-line p-[74px_30px] text-center text-sm text-muted">
          Setting up 2FA…
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto mb-[100px] mt-[55px] max-w-[520px] px-4">
      {/* ── Back ── */}
      <button
        className="border-0 bg-transparent p-0 text-xs text-muted"
        onClick={() => navigate("/profile")}
      >
        ← Back
      </button>

      {/* ── Section ── */}
      <section className="mt-8 border border-[#e7e5dc] bg-paper p-7">
        <p className="mb-4 font-mono text-[10px] tracking-[.13em] text-green">
          TWO-FACTOR AUTHENTICATION
        </p>
        <h1 className="mb-2 font-display text-[28px] font-semibold leading-tight text-ink">
          Set Up 2FA
        </h1>
        <p className="mb-6 text-sm text-muted leading-6">
          Scan the QR code below with any authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.) and enter the 6-digit code to enable two-factor authentication on your account.
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

        {setupData && (
          <>
            {/* QR Code */}
            <div className="mb-6 border border-line bg-[#f9f8f5] p-6 text-center">
              <img
                src={`data:image/png;base64,${setupData.qrCodeBase64}`}
                alt="2FA QR Code"
                className="mx-auto h-48 w-48"
              />
              <p className="mt-3 text-[11px] text-muted">Scan with your authenticator app</p>
            </div>

            {/* Manual Entry */}
            <button
              type="button"
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="mb-4 border-0 border-b border-orange bg-transparent p-0 text-[11px] text-orange"
            >
              {showManualEntry ? "Hide manual entry" : "Can't scan? Enter manually"}
            </button>

            {showManualEntry && (
              <div className="mb-6 border border-line bg-[#f9f8f5] p-4">
                <p className="mb-2 text-[10px] uppercase text-muted">Manual entry code:</p>
                <code className="block break-all border-0 border-b border-line bg-transparent py-2 font-mono text-sm text-ink">
                  {setupData.secret}
                </code>
                <p className="mt-3 text-[10px] text-muted">
                  <strong>Account:</strong> {setupData.accountName}
                  <br />
                  <strong>Issuer:</strong> {setupData.issuer}
                </p>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="grid gap-5">
              <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
                <span>Enter 6-digit code</span>
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

              <button
                type="submit"
                disabled={verifying || totpCode.length !== 6}
                className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
              >
                {verifying ? "Verifying…" : "Verify & Enable 2FA"}
                <span className="float-right text-lg">→</span>
              </button>
            </form>

            {/* Info */}
            <div className="mt-6 text-[11px] leading-6 text-muted">
              <p>
                <strong>Need help?</strong> Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator from your app store. The code changes every 30 seconds.
              </p>
            </div>
          </>
        )}
      </section>

      {/* Backup Codes Modal */}
      <BackupCodesModal
        isOpen={showBackupCodesModal}
        codes={backupCodes}
        onClose={() => {
          setShowBackupCodesModal(false);
          navigate("/profile", {
            state: {
              message: "2FA enabled successfully! Backup codes saved.",
            },
          });
        }}
        onGenerate={handleGenerateBackupCodes}
      />
    </main>
  );
}
