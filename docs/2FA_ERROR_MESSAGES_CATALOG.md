# 2FA Error Messages Reference

## Complete Error Message Catalog

### TOTP Code Verification (During Login)

| Scenario | HTTP Status | Error Message |
|----------|------------|---------------|
| Invalid 2FA code | 400 | Invalid 2FA code. Please check and try again. |
| Expired TOTP code | 400 | The code has expired. Please try again. |
| No error data | 400 | Invalid 2FA code. Please try again. |
| Session expired | 401 | Session expired. Please log in again. |
| Code not found | 404 | Verification code not found. Please log in again. |
| Too many attempts | 429 | Too many verification attempts. Please wait a few minutes before trying again. |
| General error | Any | Verification failed. Please try again. |
| Network error | 0 | Connection error. Please check your internet and try again. |
| Request timeout | 408 | Request timeout. Please check your connection and try again. |

---

### Backup Code Verification (During Login)

| Scenario | HTTP Status | Error Message |
|----------|------------|---------------|
| Invalid backup code | 400 | Invalid backup code. Please check and try again. |
| Expired/used backup code | 400 | The backup code has expired or been used. Please use a different code. |
| No error data | 400 | Invalid backup code. Please try again. |
| Session expired | 401 | Session expired. Please log in again. |
| Code not found | 404 | Verification code not found. Please log in again. |
| Too many attempts | 429 | Too many verification attempts. Please wait a few minutes before trying again. |
| Network error | 0 | Connection error. Please check your internet and try again. |
| Request timeout | 408 | Request timeout. Please check your connection and try again. |

---

### TOTP Setup Initialization

| Scenario | HTTP Status | Error Message |
|----------|------------|---------------|
| Invalid setup request | 400 | Invalid setup request. Please try again. |
| Not authenticated | 401 | Session expired. Please log in again. |
| Already enabled | 409 | 2FA is already enabled for this account. |
| Network error | 0 | Connection error. Please check your internet and try again. |
| Request timeout | 408 | Request timeout. Please check your connection and try again. |
| Setup request failure | Any | Failed to generate 2FA setup. Please try again. |

---

### TOTP Code Verification (During Setup)

| Scenario | HTTP Status | Error Message |
|----------|------------|---------------|
| Invalid 2FA code | 400 | Invalid 2FA code. Please check and try again. |
| Code verification error | 400 | The code you entered is incorrect. Please try again. |
| Session expired | 401 | Session expired. Please log in again. |
| Already enabled | 409 | 2FA is already enabled. Please disable it first if you want to re-enable. |
| Too many attempts | 429 | Too many verification attempts. Please wait a few minutes before trying again. |
| Network error | 0 | Connection error. Please check your internet and try again. |
| Request timeout | 408 | Request timeout. Please check your connection and try again. |
| Generic verification error | Any | Invalid verification code. Please try again. |

---

## Error Message Categories

### User Input Errors (HTTP 400)
> These errors occur when the user enters invalid data
- "Invalid 2FA code. Please check and try again."
- "Invalid backup code. Please check and try again."
- "The code has expired. Please try again."
- "The backup code has expired or been used. Please use a different code."
- "The code you entered is incorrect. Please try again."

**What users should do:** Re-check the code they entered and try again

---

### Authentication Errors (HTTP 401)
> These errors occur when the user's session is not valid
- "Session expired. Please log in again."

**What users should do:** Log in again with their credentials

---

### Not Found Errors (HTTP 404)
> These errors occur when the requested resource doesn't exist
- "Verification code not found. Please log in again."

**What users should do:** Log in again and request a new code

---

### Conflict Errors (HTTP 409)
> These errors occur when there's a conflict with existing data
- "2FA is already enabled for this account."
- "2FA is already enabled. Please disable it first if you want to re-enable."

**What users should do:** If they want to change 2FA settings, disable the current setup first

---

### Rate Limiting Errors (HTTP 429)
> These errors occur when the user has made too many requests
- "Too many verification attempts. Please wait a few minutes before trying again."
- "Too many verification attempts. Please wait a few minutes before trying again."

**What users should do:** Wait a few minutes before attempting again

---

### Network Errors (HTTP 0)
> These errors occur when there's no internet connection
- "Connection error. Please check your internet and try again."

**What users should do:** Check internet connection and retry

---

### Timeout Errors (HTTP 408)
> These errors occur when the request takes too long
- "Request timeout. Please check your connection and try again."

**What users should do:** Check internet connection and retry

---

## Implementation Notes

### Error Detection Logic

```javascript
// For TOTP codes
if (status === 400 && message.includes("invalid")) {
  // Invalid code scenario
} else if (status === 400 && message.includes("expired")) {
  // Expired code scenario
}

// For backup codes (context-aware)
if (useBackupCode && status === 400) {
  // Backup code specific error
}
```

### Field Behavior After Errors

```javascript
// Clear input fields after error
if (useBackupCode) {
  setBackupCode('');
} else {
  setTotpCode('');
}

// Auto-focus for quick retry
input.autoFocus = true;
```

### State Management

```javascript
// Error state
setError(userMessage);
setMessage(''); // Clear success messages

// Input state
setTotpCode('');
setBackupCode('');

// Interaction state
setVerifying(false);
```

---

## User Experience Flow

### Successful Verification
```
User enters code
    ↓
Code is correct
    ↓
✅ Login/Setup completed
    ↓
Redirect to destination
```

### Failed Verification with Recovery
```
User enters code
    ↓
Code is incorrect
    ↓
❌ Error message displayed
    ↓
Input field cleared
    ↓
Input field auto-focused
    ↓
User can retry immediately
```

### Rate Limited Scenario
```
User enters code multiple times (5+ attempts)
    ↓
Rate limit reached
    ↓
❌ "Too many attempts. Wait X minutes..." message
    ↓
Try button disabled
    ↓
Wait timer begins
    ↓
After wait, user can retry
```

### Session Expired Scenario
```
User on 2FA page
    ↓
Session expires
    ↓
User attempts verification
    ↓
❌ "Session expired. Please log in again." message
    ↓
Auto-redirect to login (after 2 seconds for setup page)
```

---

## Testing Checklist

### Login 2FA
- [ ] Correct TOTP code → Login succeeds
- [ ] Wrong TOTP code (400) → Shows "Invalid 2FA code..."
- [ ] Expired TOTP code (400) → Shows "The code has expired..."
- [ ] Correct backup code → Login succeeds
- [ ] Wrong backup code (400) → Shows "Invalid backup code..."
- [ ] Expired backup code (400) → Shows "The backup code has expired..."
- [ ] Rate limited (429) → Shows "Too many attempts..."
- [ ] Session expired (401) → Shows "Session expired..."
- [ ] Network error (0) → Shows "Connection error..."
- [ ] Timeout (408) → Shows "Request timeout..."

### Setup 2FA
- [ ] Load page when authenticated → Shows QR code
- [ ] Load page when not authenticated → Redirects to login
- [ ] Enter correct code → 2FA enabled, redirect to profile
- [ ] Enter wrong code (400) → Shows "Invalid 2FA code..."
- [ ] Rate limited (429) → Shows "Too many attempts..."
- [ ] Already enabled (409) → Shows "Already enabled..."
- [ ] Session expires → Redirects to login
- [ ] Network error → Shows "Connection error..."

---

## Related Files

- `frontend/src/components/auth/TotpVerificationPage.jsx`
- `frontend/src/components/auth/TotpSetupPage.jsx`
- `frontend/src/utils/errorHandler.js`
