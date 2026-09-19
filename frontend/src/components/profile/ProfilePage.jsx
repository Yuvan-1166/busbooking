import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import DisableTotpModal from "../../components/auth/DisableTotpModal";
import { getUserFriendlyErrorMessage } from "../../utils/errorMessages";

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(first, last) {
  return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase() || "?";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function roleBadge(role) {
  const clean = role?.replace("ROLE_", "") || "USER";
  const colors = {
    ADMIN: "badge-info",
    OPERATOR: "badge-success",
    PASSENGER: "badge-neutral",
  };
  return colors[clean] || "badge-neutral";
}

// ── Helper Components ────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <h2 className="mb-4 text-sm font-semibold text-neutral-900">{children}</h2>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, ...props }) {
  return (
    <input className="input" value={value} onChange={onChange} {...props} />
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-200 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm font-medium text-neutral-600">{label}</dt>
      <dd
        className={`text-right text-sm text-neutral-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function EditableInfoRow({
  label,
  value,
  editValue,
  onChange,
  type = "text",
  disabled = false,
  placeholder,
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-200 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm font-medium text-neutral-600">{label}</dt>
      <dd className="text-right text-sm text-neutral-900 min-w-0 flex-1">
        <input
          type={type}
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="input text-sm w-full max-w-48 text-right"
        />
      </dd>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfilePage({ onLogout }) {
  const { session, hasRole } = useAuth();
  const navigate = useNavigate();
  const isAdmin = hasRole("ADMIN");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Active section: 'info' | 'password' | 'security'
  const [section, setSection] = useState("info");

  // Edit mode for inline editing in overview
  const [editMode, setEditMode] = useState(false);

  // Edit profile form
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Password reset form
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [message, setMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);

  // TOTP 2FA state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [setupMode, setSetupMode] = useState(false); // 'setup' | 'verify' | false
  const [totpSetupData, setTotpSetupData] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [totpSuccess, setTotpSuccess] = useState("");

  // Disable TOTP modal state
  const [showDisableTotpModal, setShowDisableTotpModal] = useState(false);

  // Mobile verification state
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileVerificationId, setMobileVerificationId] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [mobileOtpError, setMobileOtpError] = useState("");
  const [mobileOtpSuccess, setMobileOtpSuccess] = useState("");

  // ── Load user ───────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        let userData = session?.email ? await api.getCurrentUser() : null;

        if (!userData) throw new Error("Could not load your profile.");
        setUser(userData);
        setEditForm({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          phone: userData.phone || "",
        });

        // Set TOTP enabled status from user data
        setTotpEnabled(userData.totpEnabled || false);

        // Set mobile verification status from user data
        setMobileVerified(userData.mobileVerified || false);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.email]);

  // ── Update profile ──────────────────────────────────────────────────────────
  const hasChanges =
    editForm.firstName !== (user?.firstName || "") ||
    editForm.lastName !== (user?.lastName || "") ||
    editForm.phone !== (user?.phone || "");

  const handleEditToggle = () => {
    if (editMode) {
      // Cancel edit - reset form to original values
      setEditForm({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: user?.phone || "",
      });
      setSaveError("");
      setSaveSuccess("");
    } else {
      // Entering edit mode - clear any success messages
      setSaveError("");
      setSaveSuccess("");
    }
    setEditMode(!editMode);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const updated = await api.updateUser({
        email: user.email,
        password: "_placeholder_", // backend requires it; only changes if different hash
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        status: user.status,
      });
      setUser(updated);
      setEditForm({
        firstName: updated.firstName || "",
        lastName: updated.lastName || "",
        phone: updated.phone || "",
      });
      setSaveSuccess("Profile updated successfully.");
      setEditMode(false); // Exit edit mode on successful save
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── TOTP Management ─────────────────────────────────────────────────────────
  const disableTotp = async (password) => {
    setTotpError("");
    setTotpSuccess("");

    try {
      await api.disableTotp({ password });
      setTotpEnabled(false);
      setTotpSuccess("Two-factor authentication has been disabled.");
      setShowDisableTotpModal(false);

      // Clear the success message after a delay
      setTimeout(() => setTotpSuccess(""), 5000);
    } catch (err) {
      throw err; // Let the modal handle the error display
    }
  };

  // ── Password reset ──────────────────────────────────────────────────────────

  const sendMobileOtpHandler = async (e) => {
    e.preventDefault();

    setMobileOtpError("");
    setMobileOtpSuccess("");

    if (!user.phone || user.phone.length !== 10) {
      setMobileOtpError(
        "Please add a valid 10-digit mobile number to your profile first.",
      );
      return;
    }

    setMobileOtpLoading(true);

    try {
      // Extract only digits from phone (remove any country code or formatting)
      const cleanPhone = user.phone.replace(/\D/g, "").slice(-10);

      const response = await api.sendMobileOtp(cleanPhone);

      if (response.success && response.data?.data?.verificationId) {
        setMobileVerificationId(response.data.data.verificationId);
        setMobileOtpSent(true);
        setMobileOtpSuccess("OTP sent successfully to your mobile number.");
      } else {
        setMobileOtpError("Failed to send OTP. Please try again.");
      }
    } catch (err) {
      const friendlyMessage = getUserFriendlyErrorMessage(
        err.message,
        "send-otp",
      );
      setMobileOtpError(friendlyMessage);
    } finally {
      setMobileOtpLoading(false);
    }
  };

  const verifyMobileOtpHandler = async (e) => {
    e.preventDefault();

    setMobileOtpError("");
    setMobileOtpSuccess("");

    if (!mobileOtp || mobileOtp.length < 4) {
      setMobileOtpError("Please enter the OTP code.");
      return;
    }

    setMobileOtpLoading(true);

    try {
      const cleanPhone = user.phone.replace(/\D/g, "").slice(-10);

      const validateResponse = await api.validateMobileOtp(
        mobileVerificationId,
        cleanPhone,
        mobileOtp,
      );

      if (validateResponse.success && validateResponse.data?.valid) {
        // Update user verification status in backend
        try {
          await api.updateMobileVerificationStatus();

          setMobileVerified(true);
          setMobileOtpSuccess("Mobile number verified successfully!");
          setMobileOtpSent(false);
          setMobileOtp("");
          setMobileVerificationId("");

          // Reload user data to get updated verification status
          const updatedUser = await api.getCurrentUser();
          setUser(updatedUser);
        } catch (updateErr) {
          const friendlyMessage = getUserFriendlyErrorMessage(
            updateErr.message,
            "update-verification",
          );
          setMobileOtpError(friendlyMessage);
        }
      } else {
        setMobileOtpError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      const friendlyMessage = getUserFriendlyErrorMessage(
        err.message,
        "verify-otp",
      );
      setMobileOtpError(friendlyMessage);
    } finally {
      setMobileOtpLoading(false);
    }
  };

  const requestOtp = async (e) => {
    e.preventDefault();

    setPwError("");
    setPwSuccess("");

    if (pwForm.password.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }

    if (pwForm.password !== pwForm.confirm) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwSaving(true);

    try {
      await api.forgotPassword(user.email);

      setMessage("We've sent a password reset code to your email.");
      setShowResetForm(true);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();

    setPwError("");
    setMessage("");

    if (!otp.trim()) {
      setPwError("Please enter the OTP.");
      return;
    }

    setPwSaving(true);

    try {
      await api.resetPassword(user.email, otp.trim(), pwForm.password);

      setMessage("Password reset successfully! You can now sign in.");

      setShowResetForm(false);
      setOtp("");
      setPwForm({
        password: "",
        confirm: "",
      });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="mx-auto mb-20 mt-8 min-h-screen max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading your profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto mb-20 mt-8 min-h-screen max-w-5xl px-4 sm:px-6">
        <div className="alert alert-error">{loadError}</div>
      </main>
    );
  }

  return (
    <main className="w-full mx-auto mb-20 mt-8 min-h-screen max-w-5xl px-4 sm:px-6">
      {/* Back button */}
      <button className="btn-ghost mb-6" onClick={() => navigate("/")}>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Home
      </button>

      {/* Profile Header */}
      <section className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {/* Avatar */}
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-2xl font-bold text-white shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
          {initials(user.firstName, user.lastName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
              {user.firstName} {user.lastName || ""}
            </h1>
            {session?.roles?.map((role) => (
              <span key={role} className={`badge ${roleBadge(role)}`}>
                {role.replace("ROLE_", "")}
              </span>
            ))}
          </div>
          <p className="mb-1 text-neutral-600">{user.email}</p>
          <p className="text-sm text-neutral-500">
            Member since {formatDate(user.createdAt)}
          </p>
        </div>

        {/* Sign Out Button */}
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <button className="btn-ghost text-error-600" onClick={onLogout}>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </section>

      {/* Tabs */}
      <nav
        className="mb-6 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1"
        aria-label="Profile sections"
      >
        <button
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            section === "info"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
          onClick={() => setSection("info")}
        >
          <svg
            className="mb-1 inline-block h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="ml-1">Overview</span>
        </button>
        <button
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            section === "password"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
          onClick={() => {
            setSection("password");
            setPwError("");
            setPwSuccess("");
          }}
        >
          <svg
            className="mb-1 inline-block h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <span className="ml-1">Password</span>
        </button>
        <button
          className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            section === "security"
              ? "bg-white text-primary-600 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
          onClick={() => {
            setSection("security");
            setTotpError("");
            setTotpSuccess("");
          }}
        >
          <svg
            className="mb-1 inline-block h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span className="ml-1">Security</span>
        </button>
      </nav>

      {/* Overview Section */}
      {section === "info" && (
        <div className="w-full grid gap-6 lg:grid-cols-2">
          <section className="card">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Personal Details</SectionLabel>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleEditToggle}
              >
                {editMode ? (
                  <>
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </>
                )}
              </button>
            </div>

            {/* Save/Error Messages */}
            {editMode && saveError && (
              <div className="alert alert-error mb-4">{saveError}</div>
            )}
            {editMode && saveSuccess && (
              <div className="alert alert-success mb-4">{saveSuccess}</div>
            )}

            {editMode ? (
              <form onSubmit={submitEdit} className="space-y-4">
                <dl className="space-y-3">
                  <EditableInfoRow
                    label="First name *"
                    value={user.firstName}
                    editValue={editForm.firstName}
                    onChange={(value) =>
                      setEditForm({ ...editForm, firstName: value })
                    }
                    disabled={saving}
                  />
                  <EditableInfoRow
                    label="Last name"
                    value={user.lastName || "—"}
                    editValue={editForm.lastName}
                    onChange={(value) =>
                      setEditForm({ ...editForm, lastName: value })
                    }
                    disabled={saving}
                  />
                  <InfoRow label="Email" value={user.email} mono />
                  <EditableInfoRow
                    label="Phone"
                    value={user.phone || "—"}
                    editValue={editForm.phone}
                    onChange={(value) =>
                      setEditForm({ ...editForm, phone: value })
                    }
                    type="tel"
                    placeholder="+91 98765 43210"
                    disabled={saving}
                  />
                </dl>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                    disabled={saving || !hasChanges}
                  >
                    {saving ? (
                      <>
                        <span className="spinner"></span>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleEditToggle}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className="space-y-3">
                <InfoRow label="First name" value={user.firstName} />
                <InfoRow label="Last name" value={user.lastName || "—"} />
                <InfoRow label="Email" value={user.email} mono />
                <div className="flex justify-between gap-4 border-b border-neutral-200 pb-3 last:border-0 last:pb-0">
                  <dt className="text-sm font-medium text-neutral-600">
                    Phone
                  </dt>
                  <dd className="flex items-center gap-2 text-right text-sm text-neutral-900">
                    {user.phone || "—"}
                    {user.phone && (
                      <span
                        className={`badge ${
                          mobileVerified ? "badge-success" : "badge-warning"
                        }`}
                      >
                        {mobileVerified ? "✓ Verified" : "Unverified"}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            )}

            {/* Mobile Verification */}
            {user.phone && !mobileVerified && (
              <div className="mt-6 rounded-lg border-2 border-warning-200 bg-warning-50 p-4">
                <p className="mb-3 text-sm text-warning-900">
                  Verify your mobile number to enhance account security.
                </p>

                {mobileOtpError && (
                  <div className="alert alert-error mb-3">{mobileOtpError}</div>
                )}
                {mobileOtpSuccess && (
                  <div className="alert alert-success mb-3">
                    {mobileOtpSuccess}
                  </div>
                )}

                {!mobileOtpSent ? (
                  <button
                    className="btn btn-primary w-full"
                    onClick={sendMobileOtpHandler}
                    disabled={mobileOtpLoading}
                  >
                    {mobileOtpLoading ? (
                      <>
                        <span className="spinner"></span>
                        Sending OTP...
                      </>
                    ) : (
                      "Verify Mobile Number"
                    )}
                  </button>
                ) : (
                  <form onSubmit={verifyMobileOtpHandler} className="space-y-3">
                    <Field label="Enter OTP">
                      <TextInput
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={mobileOtp}
                        onChange={(e) => setMobileOtp(e.target.value)}
                        disabled={mobileOtpLoading}
                        placeholder="Enter 6-digit OTP"
                      />
                    </Field>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary flex-1"
                        disabled={mobileOtpLoading}
                      >
                        {mobileOtpLoading ? (
                          <>
                            <span className="spinner"></span>
                            Verifying...
                          </>
                        ) : (
                          "Verify OTP"
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => {
                          setMobileOtpSent(false);
                          setMobileOtp("");
                          setMobileOtpError("");
                          setMobileOtpSuccess("");
                        }}
                        disabled={mobileOtpLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>

          <section className="card">
            <SectionLabel>Account Information</SectionLabel>
            <dl className="space-y-3">
              <InfoRow label="Status" value={user.status} />
              <InfoRow label="Created" value={formatDate(user.createdAt)} />
              <InfoRow
                label="Last updated"
                value={formatDate(user.updatedAt)}
              />
            </dl>
          </section>
        </div>
      )}

      {/* Password Section */}
      {section === "password" && (
        <div className="w-full">
          <section className="card">
            <SectionLabel>Change Password</SectionLabel>

            {pwError && <div className="alert alert-error mb-5">{pwError}</div>}
            {pwSuccess && (
              <div className="alert alert-success mb-5">{pwSuccess}</div>
            )}

            <form
              className="space-y-4"
              onSubmit={showResetForm ? handleReset : requestOtp}
            >
              <Field label="New password *">
                <TextInput
                  type="password"
                  required
                  minLength={8}
                  value={pwForm.password}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, password: e.target.value })
                  }
                  disabled={pwSaving}
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                />
              </Field>
              <Field label="Confirm new password *">
                <TextInput
                  type="password"
                  required
                  minLength={8}
                  value={pwForm.confirm}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirm: e.target.value })
                  }
                  disabled={pwSaving}
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                />
              </Field>

              {showResetForm && (
                <Field label="Verification Code *">
                  <TextInput
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={pwSaving}
                    placeholder="Enter the 6-digit OTP"
                  />
                  <p className="form-hint">Enter the code sent to your email</p>
                </Field>
              )}

              <div className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="mb-2 font-medium">Password requirements:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    {pwForm.password.length >= 8 ? (
                      <svg
                        className="h-4 w-4 text-success-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 text-neutral-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    {pwForm.password && pwForm.password === pwForm.confirm ? (
                      <svg
                        className="h-4 w-4 text-success-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 text-neutral-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    Passwords match
                  </li>
                </ul>
              </div>

              <button className="btn btn-primary btn-lg" disabled={pwSaving}>
                {pwSaving ? (
                  <>
                    <span className="spinner"></span>
                    {showResetForm ? "Resetting..." : "Sending OTP..."}
                  </>
                ) : showResetForm ? (
                  "Verify & Reset Password"
                ) : (
                  "Send OTP to Email"
                )}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Security Section */}
      {section === "security" && (
        <div className="w-full">
          <section className="card">
            <SectionLabel>Two-Factor Authentication (2FA)</SectionLabel>

            <p className="mb-6 text-neutral-700">
              Add an extra layer of security to your account by enabling
              two-factor authentication. You'll need an authenticator app like
              Zoho OneAuth, Google Authenticator, Microsoft Authenticator, or
              Authy.
            </p>

            {totpError && (
              <div className="alert alert-error mb-5">{totpError}</div>
            )}
            {totpSuccess && (
              <div className="alert alert-success mb-5">{totpSuccess}</div>
            )}

            {/* Current Status */}
            <div
              className={`mb-6 flex items-center gap-3 rounded-lg border-2 p-4 ${
                totpEnabled
                  ? "border-success-200 bg-success-50"
                  : "border-neutral-200 bg-neutral-50"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                {totpEnabled ? (
                  <svg
                    className="h-6 w-6 text-success-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6 text-neutral-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-semibold text-neutral-900">
                  2FA is currently {totpEnabled ? "enabled" : "disabled"}
                </p>
                <p className="text-sm text-neutral-600">
                  {totpEnabled
                    ? "Your account is protected with two-factor authentication"
                    : "Enable 2FA for enhanced security"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {!totpEnabled ? (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate("/totp/setup")}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Enable Two-Factor Authentication
              </button>
            ) : (
              <button
                className="btn btn-danger btn-lg"
                onClick={() => setShowDisableTotpModal(true)}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Disable Two-Factor Authentication
              </button>
            )}
          </section>
        </div>
      )}

      {/* Disable 2FA Modal */}
      <DisableTotpModal
        isOpen={showDisableTotpModal}
        onClose={() => setShowDisableTotpModal(false)}
        onConfirm={disableTotp}
      />
    </main>
  );
}
