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
    <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 z-50">
      <div className="bg-paper rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-[#f7e5df] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#8c3e2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Disable Two-Factor Authentication</h2>
          <p className="text-sm text-muted">
            Enter your password to disable 2FA on your account.
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

        {/* Form */}
        <form className="grid gap-[15px]" onSubmit={handleSubmit}>
          <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
            Account password <span className="text-orange">*</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(''); // Clear error on input change
              }}
              placeholder="••••••••"
              className="w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-ink outline-0"
              disabled={isSubmitting}
              autoFocus
              required
            />
          </label>

          <p className="text-xs text-muted mt-2">
            ⓘ We need your password to confirm this action for security purposes.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 border border-line bg-transparent px-4 py-3 text-sm font-bold text-ink hover:bg-[#f9f9f7] disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 border-0 bg-[#8c3e2d] px-4 py-3 text-sm font-bold text-white hover:bg-[#6b2e22] disabled:opacity-50"
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? 'Confirming…' : 'Confirm & Disable'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 pt-6 border-t border-line">
          <p className="text-xs text-muted text-center">
            You'll need to re-enable 2FA to use it again.
          </p>
        </div>
      </div>
    </div>
  );
}
