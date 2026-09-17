# Authentication Flow Redesign - TOTP 2FA Optional

## Overview
Redesigned the authentication flow to remove the mandatory TOTP setup after email verification. Users can now log in immediately after verifying their email, and optionally enable TOTP 2FA from their profile page.

## Changes Summary

### What Changed
**Before:**
1. User registers → Verifies email with OTP → **Must set up TOTP 2FA** → Can login
2. Temp token flow with complex state management
3. Forced 2FA for all users

**After:**
1. User registers → Verifies email with OTP → **Can login immediately**
2. Optional 2FA setup available in Profile → Security tab
3. Standard JWT authentication for TOTP setup
4. 2FA is now opt-in, not mandatory

---

## Backend Changes

### 1. OtpService.java
**File:** `busbooking/src/main/java/com/yuvan/busbooking/auth/service/OtpService.java`

**Change:** Modified `verify()` method to activate user immediately after OTP verification

```java
// Activate user immediately after OTP verification
// TOTP 2FA setup is now optional and done from profile page
user.setStatus(UserStatus.ACTIVE);
user.setOnboardingCompleted(true);
userRepository.save(user);
return null;
```

### 2. AuthController.java
**File:** `busbooking/src/main/java/com/yuvan/busbooking/auth/controller/AuthController.java`

**Change:** Updated `/auth/verify/confirm` endpoint

```java
@PostMapping("/verify/confirm")
public OtpVerifyResponse confirmOtp(@Valid @RequestBody VerifyOtpRequest request) {
    otpService.verify(request.email(), request.otp(), OtpPurpose.REGISTRATION);
    return new OtpVerifyResponse("Email verified successfully. You can now sign in.");
}
```

---

## Frontend Changes

### 1. AuthPage.jsx
**File:** `frontend/src/auth/AuthPage.jsx`

**Change:** Removed TOTP setup navigation from `submitOtp()` function

```javascript
// OTP verified successfully - user can now login
const response = await api.verifyOtp(pendingEmail, otp.trim());
setMode("login");
setForm({ email: pendingEmail, password: "" });
setMessage("Email verified! You can now sign in.");
```

### 2. TotpSetupPage.jsx
**File:** `frontend/src/components/auth/TotpSetupPage.jsx`

**Major Refactor:** Now uses regular authentication instead of temp tokens

- Uses `useAuth()` hook to check session
- Calls `api.setupTotp()` with JWT authentication
- Redirects to `/profile` on success

### 3. ProfilePage.jsx
**File:** `frontend/src/components/profile/ProfilePage.jsx`

**Addition:** New "Security (2FA)" tab with:
- 2FA status indicator
- "Enable 2FA" button → navigates to `/totp/setup`
- "Disable 2FA" button (with confirmation)

### 4. api.js
**File:** `frontend/src/api.js`

**Addition:** New API methods:
```javascript
setupTotp: () => request('/auth/totp/setup', { method: 'POST' }),
verifyTotpSetup: (totpCode) => request('/auth/totp/verify-setup', { method: 'POST', body: JSON.stringify({ totpCode }) }),
disableTotp: () => request('/auth/totp/disable', { method: 'POST' }),
```

---

## User Flows

### Registration Flow (New Users)
1. Register → Verify email with OTP → ✅ Can login immediately
2. Optional: Go to Profile → Security → Enable 2FA

### 2FA Setup Flow (Optional)
1. Profile → Security → "Enable 2FA"
2. Navigate to `/totp/setup` (authenticated)
3. Scan QR code with authenticator app
4. Enter verification code
5. ✅ 2FA enabled → Redirect to profile

### Login Flow (With 2FA Enabled)
1. Enter email/password
2. Backend returns `{ requiresTotp: true, tempToken: "..." }`
3. Navigate to `/totp/verify`
4. Enter 6-digit code
5. ✅ Logged in

### Login Flow (Without 2FA)
1. Enter email/password
2. ✅ Logged in immediately

---

## Files Modified

### Backend
1. `busbooking/src/main/java/com/yuvan/busbooking/auth/service/OtpService.java`
2. `busbooking/src/main/java/com/yuvan/busbooking/auth/controller/AuthController.java`

### Frontend
1. `frontend/src/auth/AuthPage.jsx`
2. `frontend/src/components/auth/TotpSetupPage.jsx`
3. `frontend/src/components/profile/ProfilePage.jsx`
4. `frontend/src/api.js`
5. `frontend/src/App.jsx`
