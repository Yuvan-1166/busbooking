import { useState } from "react";
import { api } from "../../api";

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await api.forgotPassword(email);
      setMessage("We've sent a password reset code to your email.");
      setShowResetForm(true);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await api.resetPassword(email, otp.trim(), newPassword);
      setMessage("Password reset successfully! You can now sign in.");
      setShowResetForm(false);
      setOtp("");
      setNewPassword("");
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = "grid gap-1.5 font-mono text-[10px] uppercase text-muted";
  const inputClass =
    "w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-ink outline-0";

  return (
    <div>

      {/* Messages */}
      {message && (
        <div
          className="mb-4 border border-[#a5bea0] bg-[#e4eee1] p-3 text-xs text-green"
          role="status"
        >
          {message}
        </div>
      )}
      {error && (
        <div
          className="mb-4 border border-[#d79b8b] bg-[#f7e5df] p-3 text-xs text-[#8c3e2d]"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Forgot Password Form */}
      {!showResetForm && (
        <form className="grid gap-[15px]" onSubmit={handleSubmit}>
          <label className={labelClass}>
            Email address
            <input
              className={inputClass}
              required
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </label>

          <button
            className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
            disabled={submitting || !email}
          >
            {submitting ? "Sending…" : "Send reset code"}
            <span className="float-right text-lg">→</span>
          </button>

          <button
            type="button"
            className="border-0 bg-transparent p-0 text-[11px] text-muted underline"
            onClick={onBack}
          >
            ← Back to sign in
          </button>
        </form>
      )}

      {/* Reset Password Form */}
      {showResetForm && (
        <form className="grid gap-[15px]" onSubmit={handleReset}>
          <label className={labelClass}>
            Verification code
            <input
              className={`${inputClass} font-mono text-2xl tracking-[.25em]`}
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              autoComplete="one-time-code"
              autoFocus
            />
          </label>

          <label className={labelClass}>
            New password
            <input
              className={inputClass}
              required
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <button
            className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
            disabled={submitting || otp.length !== 6 || !newPassword}
          >
            {submitting ? "Resetting…" : "Reset password"}
            <span className="float-right text-lg">→</span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-[11px] text-muted underline disabled:opacity-50"
              onClick={handleSubmit}
            >
              {submitting ? "Sending…" : "Resend code"}
            </button>
            <button
              type="button"
              className="border-0 bg-transparent p-0 text-[11px] text-muted underline"
              onClick={() => {
                setShowResetForm(false);
                setOtp("");
                setNewPassword("");
              }}
            >
              ← Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
