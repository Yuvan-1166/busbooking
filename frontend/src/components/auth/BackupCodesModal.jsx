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
      <div className="max-w-[520px] w-full max-h-[90vh] overflow-y-auto border border-[#e7e5dc] bg-paper p-7">
        {/* Header */}
        <h2 className="mb-2 font-display text-[28px] font-semibold leading-tight text-ink">
          Backup Codes
        </h2>
        <p className="mb-6 text-sm leading-6 text-muted">
          Save these codes in a secure location. Each code can only be used once to access your account if you lose access to your authenticator.
        </p>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div
            className="mb-4 border border-[#a5bea0] bg-[#e4eee1] px-4 py-3 text-xs text-green"
            role="status"
          >
            {message}
          </div>
        )}

        {/* Codes Display */}
        {codes && codes.length > 0 && (
          <div className="mb-6 border border-line bg-[#f9f8f5] p-4">
            <p className="mb-3 font-mono text-[10px] uppercase text-muted">Your Backup Codes</p>
            <div className="grid gap-2">
              {codes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-line pb-2 last:border-0 last:pb-0"
                >
                  <code className="font-mono text-sm text-ink">{code}</code>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(code, index)}
                    className="border-0 border-b border-orange bg-transparent px-0 py-0 text-[10px] font-bold text-orange"
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
              className="mt-4 w-full border border-line bg-transparent px-4 py-2.5 text-left font-bold text-ink hover:bg-[#fdfcf9]"
            >
              ⬇ Download as Text File
              <span className="float-right text-lg">→</span>
            </button>
          </div>
        )}

        {/* Generate Button */}
        {(!codes || codes.length === 0) && (
          <div className="mb-6">
            <p className="mb-4 text-xs text-muted">
              No backup codes generated yet. Generate them now to secure your account.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full border-0 bg-green px-4 py-3.5 text-left font-bold text-white disabled:opacity-45"
            >
              {isGenerating ? "Generating…" : "Generate Backup Codes"}
              <span className="float-right text-lg">→</span>
            </button>
          </div>
        )}

        {/* Regenerate Button */}
        {codes && codes.length > 0 && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mb-4 w-full border-0 bg-orange px-4 py-3.5 text-left font-bold text-white disabled:opacity-45"
          >
            {isGenerating ? "Regenerating…" : "Regenerate New Codes"}
            <span className="float-right text-lg">→</span>
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full border border-line bg-transparent px-4 py-2.5 font-bold text-ink hover:bg-[#fdfcf9]"
        >
          Done
        </button>

        {/* Info */}
        <div className="mt-6 border-t border-line pt-4 text-[10px] text-muted">
          <ul className="grid gap-2">
            <li>✓ Each code can only be used once</li>
            <li>✓ Store these codes in a secure location (like a password manager)</li>
            <li>✓ Do not share these codes with anyone</li>
            <li>✓ Regenerating old codes will create new ones</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
