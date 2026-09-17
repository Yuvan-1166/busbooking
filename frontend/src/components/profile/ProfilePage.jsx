import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import DisableTotpModal from "../../components/auth/DisableTotpModal";

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
    ADMIN: "bg-[#d9e5e7] text-[#2a6a9a]",
    OPERATOR: "bg-[#dce5d5] text-green",
    PASSENGER: "bg-[#fff6ee] text-orange",
  };
  return colors[clean] || "bg-[#f0f0ec] text-muted";
}

// ── Sections ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="mb-4 font-mono text-[10px] tracking-[.13em] text-green">
      {children}
    </p>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
      {label}
      {children}
    </label>
  );
}

function TextInput({ value, onChange, ...props }) {
  return (
    <input
      className="w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-ink outline-0 focus:border-orange"
      value={value}
      onChange={onChange}
      {...props}
    />
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

  // Active section: 'info' | 'edit' | 'password' | 'security'
  const [section, setSection] = useState("info");

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
  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    try {
      const updated = await api.updateUser(user.id, {
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
      setMobileOtpError("Please add a valid 10-digit mobile number to your profile first.");
      return;
    }
    
    setMobileOtpLoading(true);
    
    try {
      // Extract only digits from phone (remove any country code or formatting)
      const cleanPhone = user.phone.replace(/\D/g, '').slice(-10);
      
      const response = await api.sendMobileOtp(cleanPhone);
      
      if (response.success && response.data?.data?.verificationId) {
        setMobileVerificationId(response.data.data.verificationId);
        setMobileOtpSent(true);
        setMobileOtpSuccess("OTP sent successfully to your mobile number.");
      } else {
        setMobileOtpError("Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setMobileOtpError(err.message || "Failed to send OTP. Please try again.");
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
      const cleanPhone = user.phone.replace(/\D/g, '').slice(-10);
      
      const validateResponse = await api.validateMobileOtp(
        mobileVerificationId,
        cleanPhone,
        mobileOtp
      );
      
      if (validateResponse.success && validateResponse.data?.valid) {
        // Update user verification status in backend
        await api.updateMobileVerificationStatus();
        
        setMobileVerified(true);
        setMobileOtpSuccess("Mobile number verified successfully!");
        setMobileOtpSent(false);
        setMobileOtp("");
        setMobileVerificationId("");
        
        // Reload user data to get updated verification status
        const updatedUser = await api.getCurrentUser();
        setUser(updatedUser);
      } else {
        setMobileOtpError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setMobileOtpError(err.message || "Failed to verify OTP. Please try again.");
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

  const tabClass = (active) =>
    `border-b-2 bg-transparent pb-3.5 text-xs transition ${active ? "border-orange font-bold text-ink" : "border-transparent text-muted hover:text-ink"}`;

  if (loading) {
    return (
      <main className="mx-auto mb-[100px] mt-[55px] max-w-[860px] px-4">
        <div className="border border-dashed border-line p-[74px_30px] text-center text-sm text-muted">
          Loading profile…
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto mb-[100px] mt-[55px] max-w-[860px] px-4">
        <div className="border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]">
          {loadError}
        </div>
      </main>
    );
  }

  const hasChanges =
    editForm.firstName.trim() !== (user.firstName || "").trim() ||
    editForm.lastName.trim() !== (user.lastName || "").trim() ||
    editForm.phone.trim() !== (user.phone || "").trim();

  return (
    <main className="mx-auto mb-[100px] mt-[55px] max-w-[860px] px-4">
      {/* ── Back ── */}
      <button
        className="border-0 bg-transparent p-0 text-xs text-muted"
        onClick={() => navigate("/")}
      >
        ← Back
      </button>

      {/* ── Hero ── */}
      <section className="mt-[43px] flex items-center gap-7 max-[600px]:flex-col max-[600px]:items-start">
        {/* Avatar */}
        <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-ink font-display text-[32px] font-semibold text-[#f9d66d]">
          {initials(user.firstName, user.lastName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="font-display text-[36px] font-semibold leading-none tracking-[-.03em] text-ink">
              {user.firstName} {user.lastName || ""}
            </h1>
            {session?.roles?.map((role) => (
              <span
                key={role}
                className={`rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-[.1em] ${roleBadge(role)}`}
              >
                {role.replace("ROLE_", "")}
              </span>
            ))}
          </div>
          <p className="font-mono text-[12px] text-muted">{user.email}</p>
          <p className="mt-1 font-mono text-[10px] text-muted">
            Member since {formatDate(user.createdAt)}
          </p>
        </div>
      </section>

      {/* ── Tabs ── */}
      <nav className="mt-8 flex gap-7 border-b border-line">
        <button
          className={tabClass(section === "info")}
          onClick={() => setSection("info")}
        >
          Overview
        </button>
        <button
          className={tabClass(section === "edit")}
          onClick={() => {
            setSection("edit");
            setSaveError("");
            setSaveSuccess("");
          }}
        >
          Edit profile
        </button>
        <button
          className={tabClass(section === "password")}
          onClick={() => {
            setSection("password");
            setPwError("");
            setPwSuccess("");
          }}
        >
          Change password
        </button>
        <button
          className={tabClass(section === "security")}
          onClick={() => {
            setSection("security");
            setTotpError("");
            setTotpSuccess("");
          }}
        >
          Security (2FA)
        </button>
      </nav>

      {/* ── Overview ── */}
      {section === "info" && (
        <div className="mt-8 grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
          <section className="border border-[#e7e5dc] bg-paper p-7">
            <SectionLabel>PERSONAL DETAILS</SectionLabel>
            <dl className="grid gap-5">
              <InfoRow label="First name" value={user.firstName} />
              <InfoRow label="Last name" value={user.lastName || "—"} />
              <InfoRow label="Email" value={user.email} />
              <div className="flex justify-between gap-4 border-b border-line pb-4 last:border-0 last:pb-0">
                <dt className="font-mono text-[10px] uppercase text-muted shrink-0">
                  Phone
                </dt>
                <dd className="text-right text-sm text-ink flex items-center gap-2">
                  {user.phone || "—"}
                  {user.phone && (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider ${
                        mobileVerified
                          ? "bg-[#e4eee1] text-green"
                          : "bg-[#fff6ee] text-orange"
                      }`}
                    >
                      {mobileVerified ? "✓ Verified" : "Unverified"}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            
            {/* Mobile Verification Card */}
            {user.phone && !mobileVerified && (
              <div className="mt-5 pt-5 border-t border-line">
                <p className="mb-3 text-xs text-muted">
                  Verify your mobile number to enhance account security.
                </p>
                
                {mobileOtpError && (
                  <div className="mb-3 border border-[#d79b8b] bg-[#f7e5df] px-3 py-2 text-[10px] text-[#8c3e2d]">
                    {mobileOtpError}
                  </div>
                )}
                {mobileOtpSuccess && (
                  <div className="mb-3 border border-[#a5bea0] bg-[#e4eee1] px-3 py-2 text-[10px] text-green">
                    {mobileOtpSuccess}
                  </div>
                )}
                
                {!mobileOtpSent ? (
                  <button
                    className="w-full border-0 bg-orange px-4 py-2.5 text-left text-xs font-bold text-white disabled:opacity-45"
                    onClick={sendMobileOtpHandler}
                    disabled={mobileOtpLoading}
                  >
                    {mobileOtpLoading ? "Sending OTP..." : "Verify Mobile Number"}
                    <span className="float-right text-sm">→</span>
                  </button>
                ) : (
                  <form onSubmit={verifyMobileOtpHandler} className="grid gap-3">
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
                        className="flex-1 border-0 bg-green px-4 py-2.5 text-xs font-bold text-white disabled:opacity-45"
                        disabled={mobileOtpLoading}
                      >
                        {mobileOtpLoading ? "Verifying..." : "Verify OTP"}
                      </button>
                      <button
                        type="button"
                        className="border border-line bg-transparent px-4 py-2.5 text-xs font-bold text-muted hover:bg-[#f9f8f5]"
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

          <section className="border border-[#e7e5dc] bg-paper p-7">
            <SectionLabel>ACCOUNT</SectionLabel>
            <dl className="grid gap-5">
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

      {/* ── Edit profile ── */}
      {section === "edit" && (
        <div className="mt-8 max-w-[520px]">
          <section className="border border-[#e7e5dc] bg-paper p-7">
            <SectionLabel>EDIT PROFILE</SectionLabel>

            {saveError && (
              <div
                className="mb-5 border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]"
                role="alert"
              >
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div
                className="mb-5 border border-[#a5bea0] bg-[#e4eee1] px-4 py-3 text-xs text-green"
                role="status"
              >
                {saveSuccess}
              </div>
            )}

            <form className="grid gap-5" onSubmit={submitEdit}>
              <div className="grid grid-cols-2 gap-5 max-[500px]:grid-cols-1">
                <Field label="First name">
                  <TextInput
                    required
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, firstName: e.target.value })
                    }
                    disabled={saving}
                  />
                </Field>
                <Field label="Last name">
                  <TextInput
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, lastName: e.target.value })
                    }
                    disabled={saving}
                  />
                </Field>
              </div>

              <Field label="Phone">
                <TextInput
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  disabled={saving}
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field label="Email">
                <input
                  className="w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-muted outline-0 cursor-not-allowed"
                  value={user.email}
                  disabled
                  title="Email cannot be changed here"
                />
              </Field>

              <button
                className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                disabled={saving || !hasChanges}
              >
                {saving ? "Saving…" : "Save changes"}
                <span className="float-right text-lg">→</span>
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ── Change password ── */}
      {section === "password" && (
        <div className="mt-8 max-w-[520px]">
          <section className="border border-[#e7e5dc] bg-paper p-7">
            <SectionLabel>CHANGE PASSWORD</SectionLabel>

            {pwError && (
              <div
                className="mb-5 border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]"
                role="alert"
              >
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div
                className="mb-5 border border-[#a5bea0] bg-[#e4eee1] px-4 py-3 text-xs text-green"
                role="status"
              >
                {pwSuccess}
              </div>
            )}

            <form
              className="grid gap-5"
              onSubmit={showResetForm ? handleReset : requestOtp}
            >
              <Field label="New password">
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
              <Field label="Confirm new password">
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
                <Field label="OTP">
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
                </Field>
              )}

              <div className="mt-1 text-[11px] leading-5 text-muted">
                <p>Password requirements:</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li
                    className={pwForm.password.length >= 8 ? "text-green" : ""}
                  >
                    At least 8 characters
                  </li>
                  <li
                    className={
                      pwForm.password && pwForm.password === pwForm.confirm
                        ? "text-green"
                        : ""
                    }
                  >
                    Passwords match
                  </li>
                </ul>
              </div>

              <button
                className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                disabled={pwSaving}
              >
                {pwSaving
                  ? showResetForm
                    ? "Resetting…"
                    : "Sending OTP…"
                  : showResetForm
                    ? "Verify OTP & Reset Password"
                    : "Send OTP"}
                <span className="float-right text-lg">→</span>
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ── Security (2FA) ── */}
      {section === "security" && (
        <div className="mt-8 max-w-[620px]">
          <section className="border border-[#e7e5dc] bg-paper p-7">
            <SectionLabel>TWO-FACTOR AUTHENTICATION (2FA)</SectionLabel>

            <p className="mb-5 text-sm leading-6 text-muted">
              Add an extra layer of security to your account by enabling
              two-factor authentication. You'll need an authenticator app like
              Zoho OneAuth, Google Authenticator, Microsoft Authenticator or Authy.
            </p>

            {totpError && (
              <div
                className="mb-5 border border-[#d79b8b] bg-[#f7e5df] px-4 py-3 text-xs text-[#8c3e2d]"
                role="alert"
              >
                {totpError}
              </div>
            )}
            {totpSuccess && (
              <div
                className="mb-5 border border-[#a5bea0] bg-[#e4eee1] px-4 py-3 text-xs text-green"
                role="status"
              >
                {totpSuccess}
              </div>
            )}

            {/* Show current status */}
            <div className="mb-6 flex items-center gap-3 rounded border border-line bg-[#f9f8f5] p-4">
              <div
                className={`h-2.5 w-2.5 rounded-full ${totpEnabled ? "bg-green" : "bg-muted"}`}
              ></div>
              <span className="text-sm">
                2FA is currently{" "}
                <strong>{totpEnabled ? "enabled" : "disabled"}</strong>
              </span>
            </div>

            {/* Not enabled - show setup button */}
            {!totpEnabled && !setupMode && (
              <button
                className="border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
                onClick={() => navigate("/totp/setup")}
              >
                Enable 2FA
                <span className="float-right text-lg">→</span>
              </button>
            )}

            {/* Enabled - show disable button */}
            {totpEnabled && (
              <button
                className="border-0 bg-[#8c3e2d] px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
                onClick={() => setShowDisableTotpModal(true)}
              >
                Disable 2FA
                <span className="float-right text-lg">×</span>
              </button>
            )}
          </section>
        </div>
      )}

      {/* Sign out */}
      <button
        className="border-0 border-b border-orange bg-transparent px-0 py-0.5 font-mono text-[11px] text-orange"
        onClick={onLogout}
      >
        Sign out
      </button>

      {/* Disable 2FA Modal */}
      <DisableTotpModal
        isOpen={showDisableTotpModal}
        onClose={() => setShowDisableTotpModal(false)}
        onConfirm={disableTotp}
      />
    </main>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line pb-4 last:border-0 last:pb-0">
      <dt className="font-mono text-[10px] uppercase text-muted shrink-0">
        {label}
      </dt>
      <dd className={`text-right text-sm text-ink ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
