import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "./AuthContext";
import { api } from "../api";
import {
  rememberRegisteredUser,
  storeSession,
  createSession,
} from "./authStorage";
import { parseApiError, getErrorMessage } from "../utils/errorHandler";
import ForgotPassword from "../components/auth/ForgotPassword";

const STATE_KEY = "twitter_oauth_state";
const USER_TYPE_KEY = "twitter_oauth_user_type";

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
  const navigate = useNavigate();

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
        console.log("=== LOGIN START ===");
        const response = await login(form);
        console.log("Login response:", response);

        // Check if TOTP verification is required
        if (response && response.requiresTotp) {
          console.log("TOTP required, navigating to /totp/verify");
          
          // Store in sessionStorage as backup
          sessionStorage.setItem('totp_verify_temp_token', response.tempToken);
          sessionStorage.setItem('totp_verify_user_id', response.userId.toString());
          
          // Clear submitting state before navigating
          setSubmitting(false);
          
          navigate("/totp/verify", {
            state: {
              tempToken: response.tempToken,
              userId: response.userId,
            },
          });
          return;
        }

        console.log("Normal login (no TOTP), navigating to /");
        // Normal login without TOTP (admin users)
        navigate("/", { replace: true });
      } else {
        const response = await register(form, registrationType);
        rememberRegisteredUser({
          email: response.email,
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
      const appError = parseApiError(submitError);
      let userMessage = getErrorMessage(appError);

      // Handle specific auth errors for login
      if (mode === "login") {
        if (appError.statusCode === 401) {
          // Check if it's an unverified email scenario
          if (submitError.message?.toLowerCase().includes("not verified") ||
              submitError.response?.data?.message?.toLowerCase().includes("not verified")) {
            // Account not verified → go to verify screen
            setPendingEmail(form.email);
            setOtp("");
            setMode("verify");
            setMessage(
              "Your email is not verified yet. Please verify it to continue.",
            );
            setSubmitting(false);
            return;
          }
          // Invalid credentials
          userMessage = "Invalid email or password. Please try again.";
        } else if (appError.statusCode === 403) {
          userMessage = "Your account has been disabled. Please contact support.";
        } else if (appError.statusCode === 429) {
          userMessage = "Too many login attempts. Please try again in a few minutes.";
        } else if (appError.statusCode === 0) {
          userMessage = "Connection error. Please check your internet and try again.";
        }
      }
      // Handle specific auth errors for registration
      else if (mode === "register") {
        if (appError.statusCode === 409) {
          userMessage = `This email is already registered as a ${registrationType}. Please sign in or use a different email.`;
        } else if (appError.statusCode === 403) {
          userMessage = "Registration is currently unavailable. Please try again later.";
        } else if (appError.statusCode === 400) {
          userMessage = "Please check your input and try again.";
        } else if (appError.statusCode === 429) {
          userMessage = "Too many registration attempts. Please try again later.";
        }
      }

      setError(userMessage);
      console.error("Auth error:", appError);
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
      const response = await api.verifyOtp(pendingEmail, otp.trim());

      // OTP verified successfully - user can now login
      console.log("OTP verification response:", response);

      // Switch to login with success message
      setMode("login");
      setForm({ email: pendingEmail, password: "" });
      setMessage("Email verified! You can now sign in.");
      setOtp("");
    } catch (otpError) {
      const appError = parseApiError(otpError);
      let userMessage = getErrorMessage(appError);

      // Handle specific OTP verification errors
      if (appError.statusCode === 400) {
        if (otpError.response?.data?.message?.toLowerCase().includes("invalid")) {
          userMessage = "The verification code is invalid. Please check and try again.";
        } else if (otpError.response?.data?.message?.toLowerCase().includes("expired")) {
          userMessage = "The verification code has expired. Please request a new one.";
        } else {
          userMessage = "Invalid verification code. Please try again.";
        }
      } else if (appError.statusCode === 404) {
        userMessage = "Verification code not found or has expired. Please request a new one.";
      } else if (appError.statusCode === 429) {
        userMessage = "Too many verification attempts. Please wait before trying again.";
      } else if (appError.statusCode === 0) {
        userMessage = "Connection error. Please check your internet and try again.";
      } else if (appError.statusCode === 408) {
        userMessage = "Request timeout. Please check your connection and try again.";
      }

      setError(userMessage);
      console.error("OTP verification error:", appError);
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
      setMessage("A new verification code has been sent to " + pendingEmail);
      setOtp("");
    } catch (resendError) {
      const appError = parseApiError(resendError);
      let userMessage = getErrorMessage(appError);

      // Handle specific resend OTP errors
      if (appError.statusCode === 429) {
        userMessage =
          "Too many requests. Please wait a few minutes before requesting another code.";
      } else if (appError.statusCode === 404) {
        userMessage = "Email not found in system. Please register first.";
      } else if (appError.statusCode === 400) {
        userMessage = "Cannot send verification code. Please try again.";
      } else if (appError.statusCode === 0) {
        userMessage = "Connection error. Please check your internet and try again.";
      } else if (appError.statusCode === 408) {
        userMessage = "Request timeout. Please check your connection and try again.";
      }

      setError(userMessage);
      console.error("Resend OTP error:", appError);
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

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      // GoogleLogin component returns credential as a JWT string directly
      const idToken = credentialResponse.credential;

      if (!idToken) {
        throw new Error("No credential received from Google");
      }

      console.log("Google OAuth success, sending token to backend...");
      // Call backend Google OAuth endpoint - role will be selected in onboarding
      // Send default PASSENGER type - will be overridden during onboarding
      const loginResponse = await api.googleOAuthCallback(idToken, "PASSENGER");
      console.log("Backend response:", loginResponse);

      // Create session from the LoginResponse and store it
      const session = createSession(loginResponse);
      storeSession(session);

      // Navigate to home - AuthContext/App will redirect to onboarding if needed
      navigate("/", { replace: true });
    } catch (googleError) {
      const appError = parseApiError(googleError);
      let userMessage = getErrorMessage(appError);

      // Handle specific Google OAuth errors
      if (appError.statusCode === 400) {
        if (googleError.message?.includes("No credential")) {
          userMessage = "Google authentication failed. Please try again.";
        } else if (googleError.response?.data?.message?.toLowerCase().includes("invalid")) {
          userMessage = "Invalid Google credential. Please try again.";
        } else {
          userMessage = "Google authentication error. Please try again.";
        }
      } else if (appError.statusCode === 401) {
        userMessage = "Google authentication failed. Please try again or use email/password.";
      } else if (appError.statusCode === 409) {
        userMessage = "This Google account is already linked. Please sign in.";
      } else if (appError.statusCode === 0) {
        userMessage = "Connection error. Please check your internet and try again.";
      } else if (appError.statusCode === 408) {
        userMessage = "Google authentication took too long. Please try again.";
      }

      setError(userMessage);
      console.error("Google OAuth error:", appError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed. Please try again or use email/password.");
    console.error("Google Sign-In error");
  };

  // ── Twitter OAuth ─────────────────────────────────────────────────────────
  const handleTwitterSignIn = async () => {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      // Ask the backend to generate a PKCE authorize URL + state token
      const { authorizeUrl, state } = await api.getTwitterAuthorizeUrl();

      if (!authorizeUrl || !state) {
        throw new Error("Failed to get Twitter authorization URL");
      }

      // Persist state and userType so TwitterCallback can read them after redirect
      sessionStorage.setItem(STATE_KEY, state);
      // Pass current registrationType as PASSENGER / OPERATOR
      const userType = registrationType === "operator" ? "OPERATOR" : "PASSENGER";
      sessionStorage.setItem(USER_TYPE_KEY, userType);

      // Redirect the browser to Twitter's authorization page
      window.location.href = authorizeUrl;
    } catch (twitterError) {
      const appError = parseApiError(twitterError);
      let userMessage = getErrorMessage(appError);

      if (appError.statusCode === 0) {
        userMessage = "Connection error. Please check your internet and try again.";
      } else if (appError.statusCode === 500) {
        userMessage = "Twitter sign-in is temporarily unavailable. Please try again later.";
      } else {
        userMessage = "Twitter sign-in failed. Please try again or use email/password.";
      }

      setError(userMessage);
      console.error("Twitter OAuth error:", twitterError);
      setSubmitting(false);
    }
    // Don't clear submitting=true here — browser is navigating away
  };

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-12">
      <section className="w-full max-w-[480px] rounded-lg border border-neutral-200 bg-white p-10 shadow-sm max-[600px]:p-6">
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500 text-2xl font-bold text-white">
            B
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-neutral-800">
            {mode === "login"
              ? "Welcome back"
              : mode === "register"
                ? "Create your account"
                : mode === "forgot-password"
                  ? "Reset password"
                  : "Verify your email"}
          </h1>
          <p className="text-sm text-neutral-500">
            {mode === "login"
              ? "Sign in to continue to your account"
              : mode === "register"
                ? "Get started with your bus booking account"
                : mode === "forgot-password"
                  ? "Enter your email to receive a reset code"
                  : `Enter the 6-digit code sent to ${pendingEmail}`}
          </p>
        </div>

        {/* ── Tabs (login / register only) ─────────────────────────────────── */}
        {mode !== "verify" && mode !== "forgot-password" && (
          <div className="mb-6 flex gap-1 rounded-md bg-neutral-100 p-1">
            <button
              type="button"
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-all ${mode === "login" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"}`}
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`flex-1 rounded px-4 py-2 text-sm font-medium transition-all ${mode === "register" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"}`}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>
        )}

        {/* ── Registration type picker ──────────────────────────────────────── */}
        {mode === "register" && (
          <div className="mb-6 grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
            <button
              type="button"
              className={`flex flex-col gap-2 rounded-md border-2 p-4 text-left transition-all ${registrationType === "passenger" ? "border-primary-500 bg-primary-50" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
              onClick={() => switchRegistrationType("passenger")}
            >
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${registrationType === "passenger" ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <strong className="text-base font-semibold text-neutral-900">Passenger</strong>
              </div>
              <span className="text-xs leading-relaxed text-neutral-600">
                Search and book bus tickets
              </span>
            </button>
            <button
              type="button"
              className={`flex flex-col gap-2 rounded-md border-2 p-4 text-left transition-all ${registrationType === "operator" ? "border-primary-500 bg-primary-50" : "border-neutral-200 bg-white hover:border-neutral-300"}`}
              onClick={() => switchRegistrationType("operator")}
            >
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${registrationType === "operator" ? "bg-primary-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <strong className="text-base font-semibold text-neutral-900">Operator</strong>
              </div>
              <span className="text-xs leading-relaxed text-neutral-600">
                Manage buses and schedules
              </span>
            </button>
          </div>
        )}

        {/* ── Messages ─────────────────────────────────────────────────────── */}
        {message && (
          <div className="alert alert-success mb-4" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-4" role="alert">
            {error}
          </div>
        )}

        {mode === "forgot-password" && (
          <ForgotPassword onBack={handleForgotPasswordBack} />
        )}

        {/* ── OTP verification form ─────────────────────────────────────────── */}
        {mode === "verify" && (
          <form className="space-y-5" onSubmit={submitOtp}>
            <div className="form-group">
              <label className="form-label">
                Verification code <span className="text-error-500">*</span>
              </label>
              <input
                className="input text-center text-2xl tracking-widest"
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
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting || otp.length !== 6}
            >
              {submitting ? "Verifying…" : "Verify email"}
            </button>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={resendOtp}
                disabled={resending || submitting}
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
              <button
                type="button"
                className="btn-ghost text-sm"
                onClick={() => switchMode("register")}
              >
                ← Back
              </button>
            </div>
          </form>
        )}

        {/* ── Login / Register form ─────────────────────────────────────────── */}
        {mode !== "verify" && mode !== "forgot-password" && (
          <form className="space-y-5" onSubmit={submit}>
            {mode === "register" && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    First name <span className="text-error-500">*</span>
                  </label>
                  <input
                    className="input"
                    required
                    name="firstName"
                    value={form.firstName}
                    onChange={updateField}
                    autoComplete="given-name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last name</label>
                  <input
                    className="input"
                    name="lastName"
                    value={form.lastName}
                    onChange={updateField}
                    autoComplete="family-name"
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">
                Email <span className="text-error-500">*</span>
              </label>
              <input
                className="input"
                required
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="text-error-500">*</span>
              </label>
              <input
                className="input"
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
              {mode === "register" && (
                <p className="form-hint">At least 8 characters</p>
              )}
            </div>
            {mode === "register" && (
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  className="input"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  autoComplete="tel"
                />
              </div>
            )}
            {mode === "register" && registrationType === "operator" && (
              <div className="space-y-5">
                <div className="form-group">
                  <label className="form-label">
                    Business name <span className="text-error-500">*</span>
                  </label>
                  <input
                    className="input"
                    required
                    name="operatorName"
                    value={form.operatorName}
                    onChange={updateField}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Registration number <span className="text-error-500">*</span>
                  </label>
                  <input
                    className="input"
                    required
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={updateField}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Contact phone <span className="text-error-500">*</span>
                  </label>
                  <input
                    className="input"
                    required
                    name="contactPhone"
                    value={form.contactPhone}
                    onChange={updateField}
                  />
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="btn-ghost text-sm"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting}
            >
              {submitting
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>
        )}

        {/* Divider */}
        {mode !== "verify" && mode !== "forgot-password" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-neutral-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social sign-in buttons */}
            <div className="space-y-3">
              {/* Google */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text={mode === "login" ? "signin_with" : "signup_with"}
                  width="100%"
                />
              </div>

              {/* Twitter / X */}
              <button
                type="button"
                onClick={handleTwitterSignIn}
                disabled={submitting}
                className="btn btn-secondary w-full"
                aria-label="Sign in with Twitter"
              >
                {/* X (Twitter) logo */}
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                {submitting
                  ? "Redirecting…"
                  : mode === "login"
                    ? "Sign in with Twitter"
                    : "Sign up with Twitter"}
              </button>
            </div>

            {/* Legal links */}
            <p className="mt-6 text-center text-xs text-neutral-500">
              By continuing, you agree to our{" "}
              <Link
                to="/terms"
                className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </>
        )}
      </section>
    </main>
  );
}
