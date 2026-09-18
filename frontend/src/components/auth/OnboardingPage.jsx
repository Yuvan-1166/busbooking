import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api";
import { parseApiError, getErrorMessage } from "../../utils/errorHandler";
import { storeSession } from "../../auth/authStorage";

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
      
      // Update session to clear twitterEmailPending flag
      const updatedSession = {
        ...session,
        twitterEmailPending: false,
      };
      storeSession(updatedSession);

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

      await api.completeOnboarding(payload);
      setMessage("Profile completed successfully! Redirecting...");
      
      // Wait a moment for the backend to complete the onboarding
      setTimeout(async () => {
        try {
          // Fetch updated user details with new roles
          const updatedUser = await api.getCurrentUser();
          const updatedSession = {
            ...session,
            onboardingRequired: false,
            ...updatedUser,
          };
          storeSession(updatedSession);
        } catch (err) {
          console.error("Failed to fetch updated user details:", err);
          // Even if we can't fetch details, mark onboarding as complete
          const updatedSession = {
            ...session,
            onboardingRequired: false,
          };
          storeSession(updatedSession);
        }
        
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

  // ── Twitter Email Verification Mode ─────────────────────────────────────
  if (emailVerificationMode === "email" && isTwitterUser) {
    const labelClass = "grid gap-1.5 font-mono text-[10px] uppercase text-muted";
    const inputClass =
      "w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-ink outline-0";

    return (
      <main className="grid min-h-screen place-items-center bg-[#dce5d5] px-4 py-[30px]">
        <section className="w-full max-w-[620px] bg-paper p-[38px] shadow-[0_18px_42px_rgba(48,53,43,.12)] max-[600px]:p-6">
          <div className="text-center mb-8">
            <h1 className="mb-3 font-display text-[42px] font-semibold leading-[.98] text-ink max-[600px]:text-4xl">
              Verify Your Email
            </h1>
            <p className="mb-7 text-[13px] leading-6 text-muted">
              Twitter sign-in doesn't provide your email. Please add one to complete your profile.
            </p>
          </div>

          {message && (
            <div className="mb-4 border border-[#a5bea0] bg-[#e4eee1] p-3 text-xs text-green" role="status">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 border border-[#d79b8b] bg-[#f7e5df] p-3 text-xs text-[#8c3e2d]" role="alert">
              {error}
            </div>
          )}

          <form className="grid gap-[15px]" onSubmit={emailOtpSent ? verifyTwitterEmail : (e) => { e.preventDefault(); sendTwitterEmailOtp(); }}>
            <label className={labelClass}>
              <span>Email Address *</span>
              <input
                className={inputClass}
                required
                type="email"
                name="email"
                value={twitterEmailForm.email}
                onChange={updateTwitterEmailField}
                placeholder="your@email.com"
                disabled={emailOtpSent}
              />
            </label>

            {emailOtpSent && (
              <label className={labelClass}>
                <span>Verification Code *</span>
                <input
                  className={`${inputClass} font-mono text-2xl tracking-[.25em]`}
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
                  autoFocus
                />
              </label>
            )}

            <button
              type="submit"
              disabled={submitting || (emailOtpSent && twitterEmailForm.otp.length !== 6)}
              className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
            >
              {submitting
                ? "Please wait…"
                : emailOtpSent
                  ? "Verify Email"
                  : "Send Verification Code"}
              <span className="float-right text-lg">→</span>
            </button>

            {emailOtpSent && (
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-[11px] text-muted underline"
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

  const labelClass = "grid gap-1.5 font-mono text-[10px] uppercase text-muted";
  const inputClass =
    "w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-ink outline-0";

  return (
    <main className="grid min-h-screen place-items-center bg-[#dce5d5] px-4 py-[30px]">
      <section className="w-full max-w-[620px] bg-paper p-[38px] shadow-[0_18px_42px_rgba(48,53,43,.12)] max-[600px]:p-6">
        <div className="text-center mb-8">
          <h1 className="mb-3 font-display text-[42px] font-semibold leading-[.98] text-ink max-[600px]:text-4xl">
            Complete Your Profile
          </h1>
          <p className="mb-7 text-[13px] leading-6 text-muted">
            Select your role and fill in your details to get started.
          </p>
        </div>

        {message && (
          <div className="mb-4 border border-[#a5bea0] bg-[#e4eee1] p-3 text-xs text-green" role="status">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 border border-[#d79b8b] bg-[#f7e5df] p-3 text-xs text-[#8c3e2d]" role="alert">
            {error}
          </div>
        )}

        <form className="grid gap-[15px]" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div>
            <p className={labelClass + " mb-3"}>Select Your Role:</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedRole("passenger")}
                className={`grid min-h-[90px] gap-1.5 border p-[15px] text-left ${
                  selectedRole === "passenger"
                    ? "border-orange bg-[#fff6ee]"
                    : "border-line bg-transparent"
                }`}
              >
                <strong className="font-display text-[17px]">🧑‍💼 Passenger</strong>
                <span className="text-[11px] leading-4 text-muted">
                  Search trips, reserve seats, and view tickets.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("operator")}
                className={`grid min-h-[90px] gap-1.5 border p-[15px] text-left ${
                  selectedRole === "operator"
                    ? "border-orange bg-[#fff6ee]"
                    : "border-line bg-transparent"
                }`}
              >
                <strong className="font-display text-[17px]">🚌 Operator</strong>
                <span className="text-[11px] leading-4 text-muted">
                  Manage buses, seats, schedules, and trips.
                </span>
              </button>
            </div>
          </div>

          {/* Common Fields */}
          <label className={labelClass}>
            First Name *
            <input
              className={inputClass}
              required
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={updateField}
              placeholder="Your first name"
            />
          </label>

          <label className={labelClass}>
            Last Name
            <input
              className={inputClass}
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={updateField}
              placeholder="Your last name"
            />
          </label>

          <label className={labelClass}>
            Phone
            <input
              className={inputClass}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={updateField}
              placeholder="Your phone number"
            />
          </label>

          {/* Operator-specific Fields */}
          {selectedRole === "operator" && (
            <>
              <div className="my-2 text-xs font-mono uppercase text-muted">
                Operator Details
              </div>

              <label className={labelClass}>
                Business Name *
                <input
                  className={inputClass}
                  required
                  type="text"
                  name="operatorName"
                  value={formData.operatorName}
                  onChange={updateField}
                  placeholder="Your business name"
                />
              </label>

              <label className={labelClass}>
                Registration Number *
                <input
                  className={inputClass}
                  required
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={updateField}
                  placeholder="Business registration number"
                />
              </label>

              <label className={labelClass}>
                Contact Phone
                <input
                  className={inputClass}
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={updateField}
                  placeholder="Business contact phone"
                />
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
          >
            {submitting ? "Completing..." : "Complete Profile"}
            <span className="float-right text-lg">→</span>
          </button>
        </form>
      </section>
    </main>
  );
}
