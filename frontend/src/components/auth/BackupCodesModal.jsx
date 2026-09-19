import { useState, useEffect } from 'react';
import { parseApiError, getErrorMessage } from '../../utils/errorHandler';

export default function BackupCodesModal({ isOpen, codes, onClose, onGenerate }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/50 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="max-w-[520px] w-full max-h-[90vh] overflow-y-auto rounded-lg border border-neutral-200 bg-white p-7 shadow-xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-semibold text-neutral-900">
            Backup Codes
          </h2>
          <p className="text-sm leading-6 text-neutral-600">
            Save these codes in a secure location. Each code can only be used once to access your account if you lose access to your authenticator.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 border border-error-200 bg-error-50 px-4 py-3 rounded text-xs text-error-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div
            className="mb-4 border border-success-200 bg-success-50 px-4 py-3 rounded text-xs text-success-700"
            role="status"
          >
            {message}
          </div>
        )}

        {/* Codes Display */}
        {codes && codes.length > 0 && (
          <div className="mb-6 border border-neutral-200 rounded-lg bg-neutral-50 p-4">
            <p className="mb-3 font-mono text-xs font-semibold uppercase text-neutral-600">Your Backup Codes</p>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
              {codes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded border border-neutral-200 bg-white p-2.5 hover:border-primary-200 transition-colors"
                >
                  <code className="font-mono text-sm font-semibold text-neutral-900">{code}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(code, index)}
                    className="ml-3 px-2 py-1 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadCodes}
              className="mt-4 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              ⬇ Download as Text File
            </button>
          </div>
        )}

        {/* Generate Button */}
        {(!codes || codes.length === 0) && (
          <div className="mb-6">
            <p className="mb-4 text-xs text-neutral-600">
              No backup codes generated yet. Generate them now to secure your account.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full rounded-lg bg-success-600 px-4 py-3 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-50 transition-colors disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating…" : "Generate Backup Codes"}
            </button>
          </div>
        )}

        {/* Regenerate Button */}
        {codes && codes.length > 0 && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mb-4 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors disabled:cursor-not-allowed"
          >
            {isGenerating ? "Regenerating…" : "Regenerate New Codes"}
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
        >
          Done
        </button>

        {/* Info */}
        <div className="mt-6 border-t border-neutral-200 pt-4">
          <ul className="grid gap-2 text-xs text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Each code can only be used once</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Store these codes in a secure location (like a password manager)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Do not share these codes with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">✓</span>
              <span>Regenerating old codes will create new ones</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
