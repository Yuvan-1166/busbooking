# TOTP Email OTP Fallback - Complete Implementation Guide

## Overview
Users can now use email OTP as a fallback if their authenticator app is unavailable during login. This reuses the existing OTP verification flow.

## 🎯 Implementation Strategy

### Why This Approach?
```
✅ Reuses existing OTP infrastructure (OtpService, EmailService)
✅ No new database tables needed
✅ Minimal code changes
✅ Maintains security standards
✅ Simple for users
✅ Industry standard pattern
```

### How It Works
```
User Logs In
    ↓
Password Verified
    ↓
2FA Required (TOTP Enabled)
    ↓
TOTP Verification Page Shows:
├─ "Enter TOTP Code" (primary)
└─ "Use Email OTP Instead" (fallback)
    ↓
User clicks fallback link
    ↓
System sends 6-digit OTP to registered email
    ↓
User receives email and enters code
    ↓
System verifies OTP
    ↓
Login complete
```

## 📋 Backend Implementation Steps

### Step 1: Add OTP Purpose Enum
**File:** `OtpPurpose.java`
```java
public enum OtpPurpose {
    REGISTRATION,           // Existing
    PASSWORD_RESET,         // Existing
    TOTP_LOGIN_FALLBACK     // NEW - Email OTP fallback for TOTP login
}
```

### Step 2: Create Request/Response DTOs
**File:** `TotpLoginOtpFallbackRequest.java` (NEW)
```java
package com.yuvan.busbooking.auth.dto;

public record TotpLoginOtpFallbackRequest(
    String tempToken,
    String email
) {}
```

**File:** `TotpLoginVerifyOtpRequest.java` (NEW)
```java
package com.yuvan.busbooking.auth.dto;

public record TotpLoginVerifyOtpRequest(
    String tempToken,
    String otp
) {}
```

### Step 3: Update AuthService
**File:** `AuthService.java`

Add these methods:
```java
/**
 * Send email OTP as fallback for TOTP login
 */
@Transactional
public void sendOtpForTotpLoginFallback(String tempToken, String email) {
    // Validate tempToken and extract userId
    Claims claims = jwtService.extractAllClaims(tempToken);
    Long userId = Long.valueOf(claims.getSubject());
    
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    
    // Verify email matches
    if (!user.getEmail().equalsIgnoreCase(email)) {
        throw new IllegalArgumentException("Email does not match user account");
    }
    
    // Verify user has TOTP enabled
    if (!user.getTotpEnabled()) {
        throw new IllegalStateException("2FA is not enabled for this user");
    }
    
    // Generate and send OTP (reuses existing OtpService)
    otpService.generateAndSend(email, OtpPurpose.TOTP_LOGIN_FALLBACK);
}

/**
 * Verify email OTP and complete TOTP login
 */
@Transactional
public LoginResponse verifyOtpForTotpLoginAndLogin(String tempToken, String otp) {
    // Validate tempToken
    if (!jwtService.isTokenValid(tempToken)) {
        throw new IllegalArgumentException("Invalid or expired session");
    }
    
    // Extract userId from tempToken
    Claims claims = jwtService.extractAllClaims(tempToken);
    Long userId = Long.valueOf(claims.getSubject());
    String email = (String) claims.get("email");
    
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    
    // Verify using existing OtpService
    try {
        otpService.verify(email, otp, OtpPurpose.TOTP_LOGIN_FALLBACK);
    } catch (OtpVerificationException e) {
        throw e;
    }
    
    // OTP verified - generate final login token
    String accessToken = jwtService.generateToken(user);
    
    return new LoginResponse(
        accessToken,
        "Bearer",
        user.getId(),
        user.getEmail(),
        user.getFirstName() + " " + user.getLastName(),
        user.getRole().toString(),
        false,
        null
    );
}
```

### Step 4: Update AuthController
**File:** `AuthController.java`

Add these endpoints:
```java
/**
 * Send email OTP as fallback for TOTP login
 * Used when user cannot access authenticator app
 * 
 * POST /api/v1/auth/login/request-otp-fallback
 */
@PostMapping("/login/request-otp-fallback")
public MessageResponse requestOtpFallback(
    @Valid @RequestBody TotpLoginOtpFallbackRequest request
) {
    authService.sendOtpForTotpLoginFallback(request.tempToken(), request.email());
    return new MessageResponse("OTP sent to your email: " + request.email());
}

/**
 * Verify email OTP and complete login
 * 
 * POST /api/v1/auth/login/verify-otp-fallback
 */
@PostMapping("/login/verify-otp-fallback")
public LoginResponse verifyOtpFallback(
    @Valid @RequestBody TotpLoginVerifyOtpRequest request
) {
    return authService.verifyOtpForTotpLoginAndLogin(request.tempToken(), request.otp());
}
```

### Step 5: Update OtpService (Minor)
The existing OtpService already supports any OtpPurpose, so minimal changes needed:
```java
// No changes needed - reuses existing generateAndSend() and verify() methods
// Just pass OtpPurpose.TOTP_LOGIN_FALLBACK as the purpose parameter
```

---

## 📱 Frontend Implementation Steps

### Step 1: Add API Methods
**File:** `api.js`

Add these methods:
```javascript
requestTotpLoginEmailOtp: (tempToken, email) =>
  request('/auth/login/request-otp-fallback', {
    method: 'POST',
    body: JSON.stringify({ tempToken, email })
  }),

verifyTotpLoginEmailOtp: (tempToken, otp) =>
  request('/auth/login/verify-otp-fallback', {
    method: 'POST',
    body: JSON.stringify({ tempToken, otp })
  }),
```

### Step 2: Update TotpVerificationPage
**File:** `TotpVerificationPage.jsx`

Add state:
```javascript
// Add to existing state
const [useEmailOtp, setUseEmailOtp] = useState(false);
const [emailOtp, setEmailOtp] = useState('');
const [emailOtpSent, setEmailOtpSent] = useState(false);
const [requestingEmailOtp, setRequestingEmailOtp] = useState(false);
```

Add handler for requesting email OTP:
```javascript
const handleRequestEmailOtp = async () => {
  setRequestingEmailOtp(true);
  setError('');
  setMessage('');

  try {
    await api.requestTotpLoginEmailOtp(tempToken, user.email);
    setEmailOtpSent(true);
    setUseEmailOtp(true);
    setMessage('Email OTP sent to ' + user.email + '. Check your inbox.');
    setTotpCode('');
  } catch (err) {
    const appError = parseApiError(err);
    let userMessage = getErrorMessage(appError);

    if (appError.statusCode === 401) {
      userMessage = 'Session expired. Please log in again.';
    } else if (appError.statusCode === 429) {
      userMessage = 'Too many OTP requests. Please wait before trying again.';
    }

    setError(userMessage);
    console.error('Email OTP request error:', appError);
  } finally {
    setRequestingEmailOtp(false);
  }
};
```

Add handler for verifying email OTP:
```javascript
const handleVerifyEmailOtp = async (e) => {
  e.preventDefault();

  const code = emailOtp.trim();

  if (code.length !== 6) {
    setError('Please enter a 6-digit code');
    return;
  }

  setVerifying(true);
  setError('');
  setMessage('');

  try {
    const response = await api.verifyTotpLoginEmailOtp(tempToken, code);

    // Clear sessionStorage
    sessionStorage.removeItem('totp_verify_temp_token');
    sessionStorage.removeItem('totp_verify_user_id');

    // Login successful
    login(response.accessToken);
    navigate('/');
  } catch (err) {
    const appError = parseApiError(err);
    let userMessage = getErrorMessage(appError);

    if (appError.statusCode === 400) {
      userMessage = 'Invalid OTP. Please check and try again.';
    } else if (appError.statusCode === 404) {
      userMessage = 'OTP not found. Please request a new one.';
    } else if (appError.statusCode === 429) {
      userMessage = 'Too many attempts. Please wait a few minutes.';
    }

    setError(userMessage);
    console.error('Email OTP verification error:', appError);
    setEmailOtp('');
  } finally {
    setVerifying(false);
  }
};
```

### Step 3: Add UI Elements

Add button to request email OTP (in existing TOTP form):
```jsx
{!useEmailOtp && (
  <button
    type="button"
    onClick={handleRequestEmailOtp}
    disabled={requestingEmailOtp}
    className="w-full text-sm text-indigo-600 hover:text-indigo-700 underline mt-4"
  >
    {requestingEmailOtp ? 'Sending email...' : "Can't access your authenticator app?"}
  </button>
)}
```

Add email OTP input form (conditionally):
```jsx
{useEmailOtp && emailOtpSent && (
  <form className="grid gap-[15px]" onSubmit={handleVerifyEmailOtp}>
    <div className="bg-[#e4eee1] border border-[#a5bea0] p-3 rounded text-sm text-green">
      📧 OTP sent to {user?.email || 'your email'}
    </div>

    <label className="grid gap-1.5 font-mono text-[10px] uppercase text-muted">
      Enter OTP code {requiredSpan}
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        value={emailOtp}
        onChange={(e) => {
          setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
          setError('');
        }}
        placeholder="000000"
        className="w-full border-0 border-b border-line bg-transparent py-2.5 text-sm text-ink outline-0 font-mono text-center text-lg tracking-widest"
        disabled={verifying}
        autoFocus
        required
      />
    </label>

    <button
      type="submit"
      disabled={verifying || emailOtp.length !== 6}
      className="mt-2 border-0 bg-orange px-[17px] py-3.5 text-left font-bold text-white disabled:opacity-45"
    >
      {verifying ? 'Verifying…' : 'Verify & Sign In'}
      <span className="float-right text-lg">→</span>
    </button>

    <button
      type="button"
      onClick={() => {
        setUseEmailOtp(false);
        setEmailOtp('');
        setEmailOtpSent(false);
        setError('');
        setMessage('');
      }}
      className="text-sm text-muted underline"
    >
      ← Back to authenticator code
    </button>
  </form>
)}
```

---

## 🔐 Error Handling

Add error scenarios to existing error detection (in errorHandler.js if needed):
```javascript
// Handle TOTP_LOGIN_FALLBACK OTP errors
if (context === 'totp-fallback') {
  if (status === 400 && message.includes('invalid')) {
    userMessage = "Invalid OTP code. Please check and try again.";
  } else if (status === 400 && message.includes('expired')) {
    userMessage = "OTP has expired. Request a new code.";
  }
}
```

---

## 🧪 Testing Checklist

### Happy Path
- [ ] User logs in with email/password
- [ ] TOTP page shows (2FA required)
- [ ] Click "Can't access app?" link
- [ ] Email OTP is sent
- [ ] User receives email
- [ ] User enters OTP code
- [ ] Login successful

### Error Cases
- [ ] Request OTP too many times (rate limited)
- [ ] Enter wrong OTP (show error)
- [ ] Enter OTP after expiry (show error)
- [ ] Invalid tempToken (show session error)
- [ ] Network error (show connection error)

### Edge Cases
- [ ] Switch between TOTP and Email OTP
- [ ] Multiple login attempts
- [ ] OTP delivery delay
- [ ] User closes browser during OTP verification

---

## 📊 Build Status

After implementation:
```
✅ Frontend modules: +0 (no new components)
✅ Backend services: +0 (reuses existing)
✅ New endpoints: 2
✅ New DTOs: 2
✅ New enum values: 1
✅ Build: Should compile successfully
```

---

**Status:** IMPLEMENTATION GUIDE READY

**Estimated Backend Time:** 1-2 hours

**Estimated Frontend Time:** 1-2 hours

**Total Time:** 2-4 hours
