import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';

export default function TotpSetupPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

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
      
      // Call the backend endpoint to generate TOTP secret and QR code
      // This now uses the regular JWT token from the session
      const data = await api.setupTotp();
      setSetupData(data);
    } catch (err) {
      setError(err.message || 'Failed to generate 2FA setup. Please try again.');
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

    try {
      // Use the api helper with regular JWT token
      await api.verifyTotpSetup(totpCode);

      // Success! Redirect to profile
      navigate('/profile', {
        state: {
          message: '2FA enabled successfully! You\'ll need to enter a code from your authenticator app when signing in.',
        },
      });
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
      setTotpCode('');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Up Two-Factor Authentication</h1>
          <p className="text-gray-600 text-sm">Scan the QR code with Zoho OneAuth or any authenticator app</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {setupData && (
          <>
            {/* QR Code Display */}
            <div className="mb-6">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <img
                  src={`data:image/png;base64,${setupData.qrCodeBase64}`}
                  alt="2FA QR Code"
                  className="mx-auto w-48 h-48"
                />
                <p className="mt-3 text-xs text-gray-500">Scan with Zoho OneAuth</p>
              </div>

              {/* Manual Entry Toggle */}
              <button
                type="button"
                onClick={() => setShowManualEntry(!showManualEntry)}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 underline mx-auto block"
              >
                {showManualEntry ? 'Hide' : 'Can\'t scan? Enter manually'}
              </button>

              {showManualEntry && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Enter this code manually:</p>
                  <code className="block bg-white px-3 py-2 rounded border border-gray-200 text-sm font-mono break-all">
                    {setupData.secret}
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    Account: {setupData.accountName}<br />
                    Issuer: {setupData.issuer}
                  </p>
                </div>
              )}
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit code from your app
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
              </div>

              <button
                type="submit"
                disabled={verifying || totpCode.length !== 6}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {verifying ? 'Verifying...' : 'Verify & Enable 2FA'}
              </button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Download Zoho OneAuth from your app store if you haven't already.
                This code changes every 30 seconds.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
