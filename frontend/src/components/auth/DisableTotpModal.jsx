import { useState } from 'react';
import { parseApiError, getErrorMessage } from '../../utils/errorHandler';

export default function DisableTotpModal({ isOpen, onClose, onConfirm }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm(password);
      // Reset form on success
      setPassword('');
    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);

      // Handle specific disable TOTP errors
      if (appError.statusCode === 401) {
        userMessage = 'Incorrect password. Please try again.';
      } else if (appError.statusCode === 400) {
        userMessage = 'Invalid request. Please try again.';
      } else if (appError.statusCode === 429) {
        userMessage = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (appError.statusCode === 0) {
        userMessage = 'Connection error. Please check your internet and try again.';
      } else if (appError.statusCode === 408) {
        userMessage = 'Request timeout. Please check your connection and try again.';
      }

      setError(userMessage);
      console.error('Disable TOTP error:', appError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="max-w-[520px] w-full border border-[#e7e5dc] bg-paper p-7">
        {/* Header */}
        <h2 className="mb-2 font-display text-[24px] font-semibold leading-tight text-ink">
          Disable 2FA
        </h2>
        <p className="mb-6 text-sm leading-6 text-muted">
          Enter your password to disable two-factor authentication on your account.
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

        {/* Form */}
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
            <span>Account password <span className="text-orange">*</span></span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••"
              className="w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-ink outline-0 focus:border-orange"
              disabled={isSubmitting}
              autoFocus
              required
            />
          </label>

          <p className="text-[10px] text-muted">
            We need your password to confirm this action for security purposes.
          </p>

          {/* Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 border border-line bg-transparent px-4 py-2.5 font-bold text-ink hover:bg-[#fdfcf9] disabled:opacity-45"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 border-0 bg-[#8c3e2d] px-4 py-3.5 text-left font-bold text-white disabled:opacity-45"
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? "Confirming…" : "Confirm & Disable"}
              <span className="float-right text-lg">→</span>
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 border-t border-line pt-4 text-center text-[10px] text-muted">
          You'll need to re-enable 2FA if you want to use it again.
        </div>
      </div>
    </div>
  );
}
