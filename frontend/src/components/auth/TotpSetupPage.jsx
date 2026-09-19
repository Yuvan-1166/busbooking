import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { parseApiError, getErrorMessage } from '../../utils/errorHandler';
import { LoadingPage } from '../common/Loading';
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
    return <LoadingPage message="Setting Up 2FA" subMessage="Preparing your authentication" showLogo={false} />;
  }

  return (
    <main className="mx-auto mb-20 mt-8 min-h-screen max-w-[520px] px-4">
      {/* Back Button */}
      <button
        className="mb-8 inline-flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
        onClick={() => navigate("/profile")}
      >
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Profile
      </button>

      {/* Section */}
      <section className="rounded-lg border border-neutral-200 bg-white p-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-primary-600"></div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">
            Security
          </p>
        </div>
        
        <h1 className="mb-3 text-3xl font-bold text-neutral-900">
          Set Up 2FA
        </h1>
        
        <p className="mb-6 text-neutral-600 leading-7">
          Scan the QR code below with any authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.) and enter the 6-digit code to enable two-factor authentication on your account.
        </p>

        {error && (
          <div
            className="mb-5 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            className="mb-5 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700"
            role="status"
          >
            {message}
          </div>
        )}

        {setupData && (
          <>
            {/* QR Code */}
            <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
              <img
                src={`data:image/png;base64,${setupData.qrCodeBase64}`}
                alt="2FA QR Code"
                className="mx-auto h-48 w-48"
              />
              <p className="mt-4 text-sm text-neutral-600">Scan with your authenticator app</p>
            </div>

            {/* Manual Entry Toggle */}
            <button
              type="button"
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="mb-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              {showManualEntry ? (
                <>
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hide manual entry
                </>
              ) : (
                <>
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Can't scan? Enter manually
                </>
              )}
            </button>

            {showManualEntry && (
              <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase text-neutral-600">Manual entry code:</p>
                <code className="block w-full break-all rounded border border-neutral-300 bg-white p-3 font-mono text-sm font-semibold text-neutral-900">
                  {setupData.secret}
                </code>
                <div className="mt-4 space-y-1 text-sm text-neutral-600">
                  <p><strong>Account:</strong> {setupData.accountName}</p>
                  <p><strong>Issuer:</strong> {setupData.issuer}</p>
                </div>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-3">
                  Enter 6-digit code
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-center text-3xl font-mono font-semibold tracking-widest text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:bg-neutral-100 disabled:cursor-not-allowed transition-all"
                  autoFocus
                  disabled={verifying}
                />
                <p className="mt-2 text-xs text-neutral-600">The code from your authenticator app</p>
              </div>

              <button
                type="submit"
                disabled={verifying || totpCode.length !== 6}
                className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
              >
                {verifying ? "Verifying…" : "Verify & Enable 2FA"}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm leading-6 text-neutral-700">
                <strong className="text-neutral-900">Need help?</strong> Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator from your app store. The code changes every 30 seconds.
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
