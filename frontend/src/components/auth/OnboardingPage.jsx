import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api";
import { parseApiError, getErrorMessage } from "../../utils/errorHandler";
import { createSession, storeSession } from "../../auth/authStorage";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // Check if user is Twitter user pending email verification
  const isTwitterUser = session?.twitterEmailPending === true;
  
  // Email verification state (for Twitter users)
  const [emailVerificationMode, setEmailVerificationMode] = useState(isTwitterUser ? "email" : null);
  const [twitterEmailForm, setTwitterEmailForm] = useState({
    email: "",
    otp: "",
  });
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState("passenger");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    operatorName: "",
    registrationNumber: "",
    contactPhone: "",
  });
  
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const updateTwitterEmailField = (e) => {
    setTwitterEmailForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // ── Twitter Email Verification ────────────────────────────────────────────
  const sendTwitterEmailOtp = async () => {
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      await api.sendOtp(twitterEmailForm.email);
      setMessage(`Verification code sent to ${twitterEmailForm.email}`);
      setEmailOtpSent(true);
    } catch (err) {
      const appError = parseApiError(err);
      setError(getErrorMessage(appError));
      console.error("Send OTP error:", appError);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyTwitterEmail = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const response = await api.verifyTwitterEmail(twitterEmailForm.email, twitterEmailForm.otp);
      setMessage("Email verified successfully! Completing onboarding...");
      
      // Replace session with new JWT that has the verified email in the subject claim
      const newSession = createSession(response);
      storeSession(newSession);

      // Proceed to profile completion
      setTimeout(() => {
        setEmailVerificationMode(null);
      }, 500);
    } catch (err) {
      const appError = parseApiError(err);
      let userMessage = getErrorMessage(appError);
      
      if (appError.statusCode === 400) {
        if (err.message?.includes("already registered")) {
          userMessage = "This email is already registered. Please use a different one.";
        } else {
          userMessage = "Invalid verification code. Please try again.";
        }
      } else if (appError.statusCode === 404) {
        userMessage = "Verification code expired. Please request a new one.";
      }

      setError(userMessage);
      console.error("Verify email error:", appError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      const payload = {
        role: selectedRole.toUpperCase(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        ...(selectedRole === "operator" && {
          operatorName: formData.operatorName,
          registrationNumber: formData.registrationNumber,
          contactPhone: formData.contactPhone,
        }),
      };

      // Backend returns a fresh JWT with updated roles. Build the new session from
      // that response so the chosen role takes effect immediately (same mechanism
      // as Twitter email verification, which preserves twitterEmailPending handling).
      const response = await api.completeOnboarding(payload);
      const updatedSession = createSession(response);
      updatedSession.onboardingRequired = false;

      // Attach fresh profile details for display (never overrides roles/token).
      try {
        const updatedUser = await api.getCurrentUser();
        Object.assign(updatedSession, {
          id: updatedUser.id ?? updatedSession.id,
          firstName: updatedUser.firstName ?? updatedSession.firstName,
          lastName: updatedUser.lastName ?? updatedSession.lastName,
          phone: updatedUser.phone ?? updatedSession.phone,
        });
      } catch (err) {
        console.error("Failed to fetch updated user details:", err);
      }

      storeSession(updatedSession);
      setMessage("Profile completed successfully! Redirecting...");

      // Wait a moment for the session-stored event to propagate
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } catch (submitError) {
      const appError = parseApiError(submitError);
      let userMessage = getErrorMessage(appError);

      if (appError.statusCode === 400) {
        userMessage = "Please fill all required fields.";
      }

      setError(userMessage);
      console.error("Onboarding error:", appError);
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return <div className="p-4">Loading...</div>;
  }

  // ── Shared bits (Zoho-inspired design) ────────────────────────────────────
  const logo = (
    <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg">
      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6h16v2H4zm0 5h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6zm2-7h12a2 2 0 012 2v1H4V6a2 2 0 012-2z"/>
        <circle cx="6" cy="19" r="1"/>
        <circle cx="18" cy="19" r="1"/>
        <rect x="7" y="8" width="2" height="2" rx="0.5"/>
        <rect x="11" y="8" width="2" height="2" rx="0.5"/>
        <rect x="15" y="8" width="2" height="2" rx="0.5"/>
      </svg>
    </div>
  );

  const card = "w-full max-w-[520px] rounded-lg border border-neutral-200 bg-white px-6 py-6 shadow-sm max-[600px]:px-4 max-[600px]:py-4";

  const heading = ({ title, subtitle }) => (
    <div className="mb-6 text-center">
      {logo}
      <div className="mb-4">
        <div className="text-xl font-bold text-neutral-900">BusBooking</div>
        <div className="text-sm text-neutral-500">Travel Smart</div>
      </div>
      <h1 className="mb-1 text-3xl font-semibold text-neutral-800">{title}</h1>
      <p className="text-sm text-neutral-500">{subtitle}</p>
    </div>
  );

  // ── Twitter Email Verification Mode ─────────────────────────────────────
  if (emailVerificationMode === "email" && isTwitterUser) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-4">
        <section className={card}>
          {heading({
            title: "Verify Your Email",
            subtitle:
              "Twitter sign-in doesn't provide your email. Please add one to complete your profile.",
          })}

          {message && (
            <div className="alert alert-success mb-2" role="status">
              {message}
            </div>
          )}
          {error && (
            <div className="alert alert-error mb-2" role="alert">
              {error}
            </div>
          )}

          <form className="space-y-3" onSubmit={emailOtpSent ? verifyTwitterEmail : (e) => { e.preventDefault(); sendTwitterEmailOtp(); }}>
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="text-error-500">*</span>
              </label>
              <input
                className="input"
                required
                type="email"
                name="email"
                value={twitterEmailForm.email}
                onChange={updateTwitterEmailField}
                placeholder="your@email.com"
                disabled={emailOtpSent}
              />
            </div>

            {emailOtpSent && (
              <div className="form-group">
                <label className="form-label">
                  Verification Code <span className="text-error-500">*</span>
                </label>
                <input
                  className="input text-center text-2xl tracking-widest"
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  name="otp"
                  value={twitterEmailForm.otp}
                  onChange={(e) =>
                    setTwitterEmailForm(prev => ({
                      ...prev,
                      otp: e.target.value.replace(/\D/g, "").slice(0, 6)
                    }))
                  }
                  placeholder="000000"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting || (emailOtpSent && twitterEmailForm.otp.length !== 6)}
            >
              {submitting
                ? "Please wait…"
                : emailOtpSent
                  ? "Verify Email"
                  : "Send Verification Code"}
            </button>

            {emailOtpSent && (
              <button
                type="button"
                className="btn-ghost w-full text-sm"
                onClick={() => {
                  setEmailOtpSent(false);
                  setTwitterEmailForm(prev => ({ ...prev, otp: "" }));
                  setMessage("");
                }}
              >
                ← Change email
              </button>
            )}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-4 py-4">
      <section className={card}>
        {heading({
          title: "Complete Your Profile",
          subtitle: "Select your role and fill in your details to get started.",
        })}

        {message && (
          <div className="alert alert-success mb-2" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-2" role="alert">
            {error}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="mb-4">
            <label className="form-label mb-2 block">Select your role</label>
            <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
              <button
                type="button"
                onClick={() => setSelectedRole("passenger")}
                className={`flex flex-col gap-2 rounded-md border-2 p-4 text-left transition-all ${
                  selectedRole === "passenger"
                    ? "border-primary-500 bg-primary-50"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    selectedRole === "passenger"
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <strong className="text-base font-semibold text-neutral-900">Passenger</strong>
                </div>
                <span className="text-xs leading-relaxed text-neutral-600">
                  Search trips, reserve seats, and view tickets.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("operator")}
                className={`flex flex-col gap-2 rounded-md border-2 p-4 text-left transition-all ${
                  selectedRole === "operator"
                    ? "border-primary-500 bg-primary-50"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    selectedRole === "operator"
                      ? "bg-primary-500 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <strong className="text-base font-semibold text-neutral-900">Operator</strong>
                </div>
                <span className="text-xs leading-relaxed text-neutral-600">
                  Manage buses, seats, schedules, and trips.
                </span>
              </button>
            </div>
          </div>

          {/* Common Fields */}
          <div className="form-group">
            <label className="form-label">
              First name <span className="text-error-500">*</span>
            </label>
            <input
              className="input"
              required
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={updateField}
              placeholder="Your first name"
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Last name</label>
            <input
              className="input"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={updateField}
              placeholder="Your last name"
              autoComplete="family-name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="input"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={updateField}
              placeholder="Your phone number"
              autoComplete="tel"
            />
          </div>

          {/* Operator-specific Fields */}
          {selectedRole === "operator" && (
            <div className="space-y-3">
              <div className="form-group">
                <label className="form-label">
                  Business Name <span className="text-error-500">*</span>
                </label>
                <input
                  className="input"
                  required
                  type="text"
                  name="operatorName"
                  value={formData.operatorName}
                  onChange={updateField}
                  placeholder="Your business name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Registration Number <span className="text-error-500">*</span>
                </label>
                <input
                  className="input"
                  required
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={updateField}
                  placeholder="Business registration number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  className="input"
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={updateField}
                  placeholder="Business contact phone"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={submitting}
          >
            {submitting ? "Completing…" : "Complete Profile"}
          </button>
        </form>
      </section>
    </main>
  );
}
