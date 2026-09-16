import { useState } from 'react';
import { parseApiError, getErrorMessage } from '../../utils/errorHandler';

export default function BackupCodesModal({ isOpen, codes, onClose, onGenerate }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleGenerate = async () => {
    setError('');
    setMessage('');
    setIsGenerating(true);

    try {
      await onGenerate();
      setMessage('Backup codes generated successfully! Save them in a secure location.');
    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);

      if (appError.statusCode === 401) {
        userMessage = 'Session expired. Please log in again.';
      } else if (appError.statusCode === 400) {
        userMessage = 'Cannot generate backup codes. Please try again.';
      } else if (appError.statusCode === 429) {
        userMessage = 'Too many requests. Please wait before trying again.';
      } else if (appError.statusCode === 0) {
        userMessage = 'Connection error. Please check your internet and try again.';
      } else if (appError.statusCode === 408) {
        userMessage = 'Request timeout. Please check your connection and try again.';
      }

      setError(userMessage);
      console.error('Backup codes generation error:', appError);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadCodes = () => {
    if (!codes || codes.length === 0) return;

    const text = `BusBooking 2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${codes.join('\n')}\n\nStore these codes securely. Each code can only be used once.`;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', 'busbooking-backup-codes.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
      <div className="bg-paper rounded-lg shadow-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-[#dce5d5] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Backup Codes</h2>
          <p className="text-sm text-muted">
            Save these codes in a secure location. Use them to access your account if you lose access to your authenticator.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 border border-[#d79b8b] bg-[#f7e5df] p-3 text-xs text-[#8c3e2d]"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div
            className="mb-4 border border-[#a5bea0] bg-[#e4eee1] p-3 text-xs text-green"
            role="status"
          >
            {message}
          </div>
        )}

        {/* Codes Display */}
        {codes && codes.length > 0 && (
          <div className="mb-6 bg-[#f5f5f5] p-4 rounded-lg">
            <p className="text-xs font-mono text-muted mb-3 uppercase">Your Backup Codes</p>
            <div className="space-y-2">
              {codes.map((code, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-line">
                  <code className="font-mono text-sm text-ink">{code}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(code, index)}
                    className="ml-2 px-2 py-1 text-xs bg-orange text-white rounded hover:bg-orange/80 disabled:opacity-50"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? '✓' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadCodes}
              className="mt-4 w-full px-4 py-2 border border-line bg-transparent text-sm font-bold text-ink hover:bg-[#f9f9f7] rounded"
            >
              ⬇ Download as Text File
            </button>
          </div>
        )}

        {/* Generate Button */}
        {(!codes || codes.length === 0) && (
          <div className="mb-6">
            <p className="text-sm text-muted mb-4 text-center">
              No backup codes generated yet. Generate them now to secure your account.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full px-4 py-3 bg-green text-white font-bold rounded hover:bg-green/90 disabled:opacity-50"
            >
              {isGenerating ? 'Generating…' : 'Generate Backup Codes'}
            </button>
          </div>
        )}

        {/* Regenerate Button */}
        {codes && codes.length > 0 && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full px-4 py-2 bg-orange text-white font-bold rounded hover:bg-orange/80 disabled:opacity-50"
          >
            {isGenerating ? 'Regenerating…' : 'Regenerate New Codes'}
          </button>
        )}

        {/* Close Button */}
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-line bg-transparent font-bold text-ink rounded hover:bg-[#f9f9f7]"
          >
            Close
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-line">
          <ul className="text-xs text-muted space-y-2">
            <li>✓ Each code can only be used once</li>
            <li>✓ Store in a secure location (password manager)</li>
            <li>✓ Do not share these codes with anyone</li>
            <li>✓ Regenerating creates new codes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
