# TOTP Email OTP Fallback - Quick Start Guide

## 🎯 What Is This?

Email OTP fallback for TOTP 2FA login. Users can use email instead of authenticator app if needed.

---

## 📋 Quick Overview

### User Flow
```
TOTP Login Page
    ↓
"Can't access app?" button
    ↓
OTP sent to email
    ↓
Enter 6-digit code
    ↓
Login successful
```

### What Reuses Existing Code
```
✅ OtpService - unchanged
✅ EmailService - unchanged
✅ OtpVerification table - unchanged
✅ Rate limiting - unchanged
✅ TempToken system - unchanged
```

### What's New
```
✅ OtpPurpose.TOTP_LOGIN_FALLBACK (enum value)
✅ 2 new DTOs (request/response)
✅ 2 new AuthService methods
✅ 2 new AuthController endpoints
✅ Updated TotpVerificationPage (frontend)
✅ 2 new API calls
```

---

## 🔧 Implementation Checklist

### Backend
- [ ] Add OtpPurpose.TOTP_LOGIN_FALLBACK
- [ ] Create TotpLoginOtpFallbackRequest DTO
- [ ] Create TotpLoginVerifyOtpRequest DTO
- [ ] Add sendOtpForTotpLoginFallback() to AuthService
- [ ] Add verifyOtpForTotpLoginAndLogin() to AuthService
- [ ] Add POST /api/v1/auth/login/request-otp-fallback endpoint
- [ ] Add POST /api/v1/auth/login/verify-otp-fallback endpoint
- [ ] Test endpoints with Postman

### Frontend
- [ ] Add requestTotpLoginEmailOtp() to api.js
- [ ] Add verifyTotpLoginEmailOtp() to api.js
- [ ] Add state to TotpVerificationPage (useEmailOtp, emailOtp, etc.)
- [ ] Add handleRequestEmailOtp() handler
- [ ] Add handleVerifyEmailOtp() handler
- [ ] Add "Can't access app?" button
- [ ] Add email OTP input form
- [ ] Add switch back button
- [ ] Test on desktop
- [ ] Test on mobile

### Testing
- [ ] Happy path (request → receive → verify)
- [ ] Rate limiting (too many requests)
- [ ] Invalid OTP (wrong code)
- [ ] Expired OTP (after 10 minutes)
- [ ] Network errors
- [ ] Session errors
- [ ] Switch between TOTP and Email OTP

---

## 📊 API Endpoints

### Request Email OTP
```
POST /api/v1/auth/login/request-otp-fallback

Request:
{
  "tempToken": "JWT from initial login",
  "email": "user@example.com"
}

Response (200):
{
  "message": "OTP sent to your email: user@example.com"
}

Errors:
401 - Session invalid
429 - Too many requests
```

### Verify Email OTP
```
POST /api/v1/auth/login/verify-otp-fallback

Request:
{
  "tempToken": "JWT from initial login",
  "otp": "123456"
}

Response (200):
{
  "accessToken": "JWT token",
  "tokenType": "Bearer",
  "userId": 123,
  "email": "user@example.com",
  "fullName": "User Name",
  "role": "PASSENGER",
  "requiresTotp": false,
  "tempToken": null
}

Errors:
400 - Invalid OTP
404 - OTP not found
429 - Too many attempts
```

---

## 🔐 Security Details

| Aspect | Value |
|--------|-------|
| **OTP Length** | 6 digits |
| **OTP Expiry** | 10 minutes |
| **Request Rate Limit** | 3 per login |
| **Verify Rate Limit** | 5 attempts |
| **Single Use** | Yes |
| **Hashed Storage** | Yes |
| **Email Confirmation** | Yes |

---

## 🚀 Implementation Time

| Task | Time |
|------|------|
| Backend Setup | 2-3 hours |
| Frontend Setup | 1-2 hours |
| Testing | 1 hour |
| **Total** | **4-5 hours** |

---

## 💡 Key Points

1. **Reuses existing infrastructure** - No schema changes
2. **Familiar to users** - Same as registration OTP
3. **Fallback only** - Doesn't replace TOTP
4. **Secure** - Rate limited, single-use, expires
5. **Simple implementation** - Minimal code changes
6. **High impact** - Solves user lock-out issues

---

## 📚 Full Documentation

- **TOTP_EMAIL_OTP_FALLBACK_PLAN.md** - Architecture & design
- **TOTP_EMAIL_OTP_IMPLEMENTATION_GUIDE.md** - Step-by-step guide
- **TOTP_EMAIL_OTP_SUMMARY.md** - Complete overview

---

## 🎯 Next Steps

1. Read TOTP_EMAIL_OTP_IMPLEMENTATION_GUIDE.md
2. Start with backend implementation
3. Test with Postman
4. Implement frontend
5. Full integration testing
6. Deploy!

---

**Status:** READY TO IMPLEMENT

**Effort:** Medium (4-5 hours)

**Impact:** High (solves major UX issue)

**Complexity:** Low (reuses existing patterns)
