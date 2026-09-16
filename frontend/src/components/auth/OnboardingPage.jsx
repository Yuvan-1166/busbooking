import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../api";
import { parseApiError, getErrorMessage } from "../../utils/errorHandler";
import { storeSession } from "../../auth/authStorage";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
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
