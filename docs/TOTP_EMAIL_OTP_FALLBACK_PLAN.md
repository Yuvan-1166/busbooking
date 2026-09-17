# TOTP Login with Email OTP Fallback Implementation Plan

## 📋 Overview

Implement an email OTP fallback option for TOTP 2FA login. When users don't have access to their authenticator app, they can request an email OTP code and use that instead.

## 🎯 Architecture

### Flow Diagram

```
Login with Email/Password
        ↓
2FA Required (TOTP Enabled)
        ↓
Display TOTP Verification Page with options:
├─ "Enter TOTP Code" (default)
└─ "Use Email OTP Instead" (fallback)
        ↓
User clicks "Use Email OTP Instead"
        ↓
Backend sends OTP to registered email
        ↓
User receives email with 6-digit code
        ↓
User enters email OTP code
        ↓
Backend verifies email OTP
        ↓
Login successful
```

## 🔧 Backend Implementation

### New Endpoint: Request Email OTP for 2FA Login
```
POST /api/v1/auth/login/request-otp-fallback
Content-Type: application/json

{
  "tempToken": "JWT token from initial login",
  "email": "user@example.com"
}

Response (200):
{
  "message": "OTP sent to your email",
  "email": "user@example.com"
}
```

### New Endpoint: Verify Email OTP for 2FA Login
```
POST /api/v1/auth/login/verify-otp-fallback
Content-Type: application/json

{
  "tempToken": "JWT token from initial login",
  "otp": "123456"
}

Response (200):
{
  "accessToken": "JWT token",
  "tokenType": "Bearer",
  "user": { ... }
}
```

### Backend Implementation Steps

#### Step 1: Create DTOs
```java
// Request to initiate email OTP fallback
public record TotpLoginRequestOtpRequest(
    String tempToken,
    String email
) {}

// Request to verify email OTP for login
public record TotpLoginVerifyOtpRequest(
    String tempToken,
    String otp
) {}
```

#### Step 2: Update AuthService
```java
// Generate and send email OTP for TOTP login fallback
public void sendOtpForTotpLoginFallback(String tempToken, String email) {
    // Validate tempToken
    // Find user
    // Generate OTP
    // Send via email
}

// Verify email OTP and complete login
public LoginResponse verifyOtpForTotpLoginAndLogin(String tempToken, String otp) {
    // Validate tempToken
    // Verify OTP
    // Return login response
}
```

#### Step 3: Update AuthController
```java
@PostMapping("/login/request-otp-fallback")
public MessageResponse requestOtpFallback(@RequestBody TotpLoginRequestOtpRequest request) {
    authService.sendOtpForTotpLoginFallback(request.tempToken(), request.email());
    return new MessageResponse("OTP sent to your email");
}

@PostMapping("/login/verify-otp-fallback")
public LoginResponse verifyOtpFallback(@RequestBody TotpLoginVerifyOtpRequest request) {
    return authService.verifyOtpForTotpLoginAndLogin(request.tempToken(), request.otp());
}
```

## 🎨 Frontend Implementation

### New Component: Email OTP Fallback Option

In `TotpVerificationPage.jsx`:

```javascript
// Add state
const [useEmailOtp, setUseEmailOtp] = useState(false);
const [emailOtp, setEmailOtp] = useState('');
const [emailOtpSent, setEmailOtpSent] = useState(false);
const [requestingEmailOtp, setRequestingEmailOtp] = useState(false);

// Handler to request email OTP
const handleRequestEmailOtp = async () => {
  setRequestingEmailOtp(true);
  setError('');
  try {
    await api.requestTotpLoginEmailOtp(tempToken, user.email);
    setEmailOtpSent(true);
    setUseEmailOtp(true);
    setMessage('Email OTP sent to ' + user.email);
  } catch (err) {
    setError('Failed to send email OTP. Please try again.');
  } finally {
    setRequestingEmailOtp(false);
  }
};

// Handler to verify email OTP
const handleVerifyEmailOtp = async (e) => {
  e.preventDefault();
  setVerifying(true);
  setError('');
  try {
    const response = await api.verifyTotpLoginEmailOtp(tempToken, emailOtp);
    login(response.accessToken);
    navigate('/');
  } catch (err) {
    setError('Invalid email OTP. Please try again.');
  } finally {
    setVerifying(false);
  }
};
```

### UI Updates

Add button: "Can't access authenticator app?"
```jsx
<button
  type="button"
  onClick={handleRequestEmailOtp}
  disabled={requestingEmailOtp || useEmailOtp}
  className="text-sm text-blue-600 underline"
>
  {requestingEmailOtp ? 'Sending...' : 'Use email code instead'}
</button>
```

Show email OTP input if requested:
```jsx
{useEmailOtp && emailOtpSent && (
  <div>
    <label>Email OTP Code</label>
    <input
      type="text"
      value={emailOtp}
      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
      maxLength={6}
      placeholder="000000"
    />
    <button onClick={handleVerifyEmailOtp}>
      Verify & Login
    </button>
  </div>
)}
```

### API Calls to Add

In `api.js`:
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

## 🔐 Security Considerations

### Backend Security
```
✅ Validate tempToken format and expiration
✅ Verify token matches the user
✅ Rate limit OTP requests (max 3 per login attempt)
✅ Rate limit OTP verification (max 5 attempts)
✅ OTP expires after 10 minutes
✅ Mark OTP as used after successful verification
✅ Log all OTP activities for audit trail
```

### Frontend Security
```
✅ Only show option after failed TOTP attempts
✅ Validate email matches logged-in user
✅ Validate OTP format (6 digits)
✅ Clear sensitive data on close
✅ Don't store OTP in localStorage
✅ Use HTTPS for all requests
```

## 🧪 Testing Scenarios

### Happy Path
```
1. User logs in with email/password
2. TOTP required
3. Click "Use email code instead"
4. Email OTP sent to inbox
5. User enters OTP code
6. Login successful
```

### Error Cases
```
1. Clicked too many times (rate limited)
2. Email delivery failed
3. Invalid OTP code
4. OTP expired
5. Wrong email address
6. TempToken expired
```

### Edge Cases
```
1. User switches between TOTP and Email OTP
2. Multiple devices requesting OTP
3. Network failure during OTP send
4. Network failure during OTP verify
5. Clock skew issues
```

## 📊 Database Considerations

### No New Tables Needed
- Use existing `OtpVerification` table
- Add new `OtpPurpose.TOTP_LOGIN_FALLBACK`
- Reuse existing OTP logic

### Schema Changes (Backend Only)
```java
// Add to OtpPurpose enum
public enum OtpPurpose {
    REGISTRATION,
    PASSWORD_RESET,
    TOTP_LOGIN_FALLBACK  // NEW
}
```

## 🚀 Implementation Priority

### Phase 1: Backend (High Priority)
- [ ] Add OtpPurpose.TOTP_LOGIN_FALLBACK
- [ ] Create request/verify OTP DTOs
- [ ] Update AuthService with fallback methods
- [ ] Create AuthController endpoints
- [ ] Add error handling
- [ ] Add rate limiting

### Phase 2: Frontend (High Priority)
- [ ] Create API methods
- [ ] Update TotpVerificationPage
- [ ] Add "Use email OTP" button
- [ ] Add email OTP input form
- [ ] Add error handling
- [ ] Test on mobile

### Phase 3: Testing & Documentation (Medium Priority)
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Create user guide
- [ ] Create API documentation

---

## 📝 Benefits

### User Benefits
```
✅ Backup authentication method
✅ Works if authenticator app lost/unavailable
✅ No need to use backup codes
✅ Simple and familiar (email OTP)
✅ Can use from any device
✅ No app installation needed
```

### System Benefits
```
✅ Reduced support tickets (user lock-outs)
✅ Better accessibility
✅ Reuses existing OTP infrastructure
✅ No new database tables
✅ Maintains security standards
✅ Follows industry best practices
```

### Security Benefits
```
✅ Still requires two factors (email + password)
✅ Still rate limited
✅ OTP expires after 10 minutes
✅ Each OTP single-use
✅ Email verification adds confirmation
✅ Doesn't weaken existing 2FA
```

---

## 🔄 Integration with Existing Flows

### Existing Components Used
```
✅ OtpService - Reused for OTP generation/verification
✅ EmailService - Reused for sending OTP
✅ TempToken system - Reused from TOTP login
✅ Rate limiting - Reused existing logic
✅ OtpVerification table - Reused existing schema
```

### No Changes to
```
✅ Login flow
✅ TOTP setup flow
✅ Backup codes flow
✅ Registration flow
✅ Password reset flow
```

---

## 📌 Next Steps

1. Start with backend implementation
2. Create DTOs and enums
3. Implement AuthService methods
4. Create AuthController endpoints
5. Test with Postman
6. Then implement frontend
7. Comprehensive testing
8. Documentation

---

**Status:** PLAN READY FOR IMPLEMENTATION

**Priority:** HIGH

**Complexity:** MEDIUM

**Effort:** 4-6 hours (backend + frontend)
