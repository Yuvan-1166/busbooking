import { useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../api";
import { rememberRegisteredUser } from "./authStorage";
import ForgotPassword from "../components/auth/ForgotPassword";

const initialForms = {
  passenger: {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  },
  operator: {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    operatorName: "",
    registrationNumber: "",
    contactPhone: "",
  },
};

export default function AuthPage() {
  const { login, register } = useAuth();

  // 'login' | 'register' | 'verify' | 'forgot-password'
  const [mode, setMode] = useState("login");
  const [registrationType, setRegistrationType] = useState("passenger");
  const [form, setForm] = useState({ email: "", password: "" });

  // OTP verification state
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setForm(
      nextMode === "login"
        ? { email: "", password: "" }
        : { ...initialForms[registrationType] },
    );
    setMessage("");
    setError("");
    setOtp("");
  };

  const switchRegistrationType = (nextType) => {
    setRegistrationType(nextType);
    setForm({ ...initialForms[nextType] });
    setError("");
  };

  const updateField = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

  // ── Registration + Login ──────────────────────────────────────────────────
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(form);
      } else {
        const response = await register(form, registrationType);
        rememberRegisteredUser({
          email: response.email,
          userId: response.userId,
        });
        // Registration succeeded → move to OTP verification step
        setPendingEmail(response.email);
        setOtp("");
        setMode("verify");
        setMessage(
          response.message ||
            "Check your email for a 6-digit verification code.",
        );
      }
    } catch (submitError) {
      // If login fails because the account isn't verified yet, go straight to
      // the verify screen so the user can complete verification without re-registering.
      if (
        mode === "login" &&
        submitError.message?.toLowerCase().includes("email not verified")
      ) {
        setPendingEmail(form.email);
        setOtp("");
        setMode("verify");
        setMessage(
          "Your email is not verified yet. Enter the code we sent you, or request a new one.",
        );
        return;
      }
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── OTP submission ────────────────────────────────────────────────────────
  const submitOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await api.verifyOtp(pendingEmail, otp.trim());
      // Verified — switch to login with success message
      setMode("login");
      setForm({ email: pendingEmail, password: "" });
      setMessage("Email verified! You can now sign in.");
      setOtp("");
    } catch (otpError) {
      setError(otpError.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const resendOtp = async () => {
    setResending(true);
    setError("");
    setMessage("");
    try {
      await api.sendOtp(pendingEmail);
      setMessage("A new code has been sent to " + pendingEmail);
      setOtp("");
    } catch (resendError) {
      setError(resendError.message);
    } finally {
      setResending(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────────────────────────
  const handleForgotPassword = () => {
    setMode("forgot-password");
    setError("");
    setMessage("");
  };

  const handleForgotPasswordBack = () => {
    setMode("login");
    setForm({ email: "", password: "" });
    setError("");
    setMessage("");
  };

  const tabClass = (tab) =>
    `border-b-2 bg-transparent p-2 text-xs ${mode === tab ? "border-ink font-bold text-ink" : "border-transparent text-muted"}`;
  const labelClass = "grid gap-1.5 font-mono text-[10px] uppercase text-muted";
  const inputClass =
    "w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-ink outline-0";

  return (
    <main className="grid min-h-screen place-items-center bg-[#dce5d5] px-4 py-[30px]">
      <section className="w-full max-w-[620px] bg-paper p-[38px] shadow-[0_18px_42px_rgba(48,53,43,.12)] max-[600px]:p-6">
        {/* Logo + heading */}
        <div className="text-center">
          <span className="mx-auto mb-[22px] grid h-[31px] w-[31px] rotate-[-8deg] place-items-center rounded-full bg-ink font-display text-base text-[#f9d66d]">
            B
          </span>
          <p className="mb-3 font-mono text-[10px] tracking-[.13em] text-green">
            BUS BOOKING
          </p>
          <h1 className="mb-3 font-display text-[42px] font-semibold leading-[.98] text-ink max-[600px]:text-4xl">
            {mode === "login"
              ? "Sign in."
              : mode === "register"
                ? "Create an account."
                : mode === "forgot-password"
                  ? "Reset password."
                  : "Verify email."}
          </h1>
          <p className="mb-7 text-[13px] leading-6 text-muted">
            {mode === "login"
              ? "Sign in as a passenger, operator, or admin."
              : mode === "register"
                ? "Register as a passenger or operator."
                : mode === "forgot-password"
                  ? "Enter your email to receive a password reset code."
                  : `We sent a 6-digit code to ${pendingEmail}`}
          </p>
        </div>

        {/* ── Tabs (login / register only) ─────────────────────────────────── */}
        {mode !== "verify" && mode !== "forgot-password" && (
          <div className="mb-[22px] grid grid-cols-2 border-b border-line">
            <button
              className={tabClass("login")}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              className={tabClass("register")}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>
        )}

        {/* ── Registration type picker ──────────────────────────────────────── */}
        {mode === "register" && (
          <div className="mb-5 grid grid-cols-2 gap-2.5 max-[600px]:grid-cols-1">
            <button
              type="button"
              className={`grid min-h-[90px] gap-1.5 border p-[15px] text-left ${registrationType === "passenger" ? "border-orange bg-[#fff6ee]" : "border-line bg-transparent"}`}
              onClick={() => switchRegistrationType("passenger")}
            >
              <strong className="font-display text-[17px]">Passenger</strong>
              <span className="text-[11px] leading-4 text-muted">
                Search trips, reserve seats, and view tickets.
              </span>
            </button>
            <button
              type="button"
              className={`grid min-h-[90px] gap-1.5 border p-[15px] text-left ${registrationType === "operator" ? "border-orange bg-[#fff6ee]" : "border-line bg-transparent"}`}
              onClick={() => switchRegistrationType("operator")}
            >
              <strong className="font-display text-[17px]">Operator</strong>
              <span className="text-[11px] leading-4 text-muted">
                Manage buses, seats, schedules, and trips.
              </span>
            </button>
          </div>
        )}

        {/* ── Messages ─────────────────────────────────────────────────────── */}
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

        {mode === "forgot-password" && (
          <ForgotPassword onBack={handleForgotPasswordBack}/>
        )

        }

        {/* ── OTP verification form ─────────────────────────────────────────── */}
        {mode === "verify" && (
          <form className="grid gap-[15px]" onSubmit={submitOtp}>
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

            <button
              className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? "Verifying…" : "Verify email"}
              <span className="float-right text-lg">→</span>
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-[11px] text-muted underline disabled:opacity-50"
                onClick={resendOtp}
                disabled={resending || submitting}
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-[11px] text-muted underline"
                onClick={() => switchMode("register")}
              >
                ← Back to register
              </button>
            </div>
          </form>
        )}

        {/* ── Login / Register form ─────────────────────────────────────────── */}
        {mode !== "verify" && mode !== "forgot-password" && (
          <form className="grid gap-[15px]" onSubmit={submit}>
            {mode === "register" && (
              <>
                <label className={labelClass}>
                  First name
                  <input
                    className={inputClass}
                    required
                    name="firstName"
                    value={form.firstName}
                    onChange={updateField}
                    autoComplete="given-name"
                  />
                </label>
                <label className={labelClass}>
                  Last name
                  <input
                    className={inputClass}
                    name="lastName"
                    value={form.lastName}
                    onChange={updateField}
                    autoComplete="family-name"
                  />
                </label>
              </>
            )}
            <label className={labelClass}>
              Email
              <input
                className={inputClass}
                required
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                autoComplete="email"
              />
            </label>
            <label className={labelClass}>
              Password
              <input
                className={inputClass}
                required
                type="password"
                name="password"
                minLength={mode === "register" ? 8 : undefined}
                value={form.password}
                onChange={updateField}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </label>
            {mode === "register" && (
              <label className={labelClass}>
                Phone
                <input
                  className={inputClass}
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  autoComplete="tel"
                />
              </label>
            )}
            {mode === "register" && registrationType === "operator" && (
              <div className="grid grid-cols-2 gap-[15px] max-[600px]:grid-cols-1">
                <label className={labelClass}>
                  Business name
                  <input
                    className={inputClass}
                    required
                    name="operatorName"
                    value={form.operatorName}
                    onChange={updateField}
                  />
                </label>
                <label className={labelClass}>
                  Registration number
                  <input
                    className={inputClass}
                    required
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={updateField}
                  />
                </label>
                <label
                  className={`${labelClass} col-span-full max-[600px]:col-span-1`}
                >
                  Contact phone
                  <input
                    className={inputClass}
                    required
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={updateField}
                  />
                </label>
              </div>
            )}
            <button
              className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
              disabled={submitting}
            >
              {submitting
                ? "Please wait…"
                : mode === "login"
                  ? "Open workspace"
                  : `Create ${registrationType} account`}
              <span className="float-right text-lg">→</span>
            </button>
            {mode === "login" && (
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-[11px] text-muted underline"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
