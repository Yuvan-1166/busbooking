# 2FA Error Handling - Quick Reference

## Error Messages by Scenario

### TOTP Code Verification (Login)
| Error | Message |
|-------|---------|
| Invalid code (400) | "Invalid 2FA code. Please check and try again." |
| Expired code (400) | "The code has expired. Please try again." |
| Too many attempts (429) | "Too many verification attempts. Please wait a few minutes..." |
| Session expired (401) | "Session expired. Please log in again." |
| Code not found (404) | "Verification code not found. Please log in again." |
| Network error (0) | "Connection error. Please check your internet and try again." |
| Timeout (408) | "Request timeout. Please check your connection and try again." |

### Backup Code Verification (Login)
| Error | Message |
|-------|---------|
| Invalid code (400) | "Invalid backup code. Please check and try again." |
| Expired/Used (400) | "The backup code has expired or been used. Please use a different code." |
| Too many attempts (429) | "Too many verification attempts. Please wait a few minutes..." |
| Session expired (401) | "Session expired. Please log in again." |
| Network error (0) | "Connection error. Please check your internet and try again." |

### 2FA Setup Initialization
| Error | Message |
|-------|---------|
| Invalid request (400) | "Invalid setup request. Please try again." |
| Not authenticated (401) | "Session expired. Please log in again." + Auto-redirect |
| Already enabled (409) | "2FA is already enabled for this account." |
| Network error (0) | "Connection error. Please check your internet and try again." |
| Timeout (408) | "Request timeout. Please check your connection and try again." |

### 2FA Setup Verification
| Error | Message |
|-------|---------|
| Invalid code (400) | "Invalid 2FA code. Please check and try again." |
| Session expired (401) | "Session expired. Please log in again." |
| Already enabled (409) | "2FA is already enabled. Please disable it first if you want to re-enable." |
| Too many attempts (429) | "Too many verification attempts. Please wait a few minutes..." |
| Network error (0) | "Connection error. Please check your internet and try again." |
| Timeout (408) | "Request timeout. Please check your connection and try again." |

## Implementation Status

### Files Updated ✅
- `frontend/src/components/auth/TotpVerificationPage.jsx`
- `frontend/src/components/auth/TotpSetupPage.jsx`
- `frontend/src/utils/errorHandler.js`

### Features Implemented ✅
- [x] Status code-based error classification
- [x] Message content analysis for specific scenarios
- [x] Context-aware error messages
- [x] Rate limiting detection
- [x] Network/timeout handling
- [x] Automatic field clearing on error
- [x] Session expiration handling
- [x] Accessibility (ARIA roles)
- [x] User-friendly, actionable messages

### Error Recovery
- ✅ Input fields auto-focus after errors
- ✅ Previous values cleared on error
- ✅ Users can retry immediately
- ✅ Clear guidance for rate-limited scenarios
- ✅ Auto-redirect for session expiration

## Code Examples

### Using Error Handler in TOTP Pages
```javascript
import { parseApiError, getErrorMessage } from '../../utils/errorHandler';

try {
  // Make API call
} catch (err) {
  const appError = parseApiError(err);
  let userMessage = getErrorMessage(appError);
  
  // Handle specific status codes
  if (appError.statusCode === 400) {
    if (err.response?.data?.message?.toLowerCase().includes("invalid")) {
      userMessage = "Invalid code. Please check and try again.";
    }
  }
  
  setError(userMessage);
}
```

### Using TOTP-specific Error Handler
```javascript
import { parseTotpError, getErrorMessage } from '../../utils/errorHandler';

try {
  // TOTP API call
} catch (err) {
  const appError = parseTotpError(err, 'verify'); // 'verify', 'login-verify', 'backup-code', 'setup'
  const userMessage = getErrorMessage(appError);
  setError(userMessage);
}
```

## Build Verification
```
✅ npm run build: Success
✅ 60 modules transformed
✅ 0 errors, 0 warnings
✅ Total bundle size: ~410KB (gzipped ~113KB)
```

## User Flow

### Login 2FA Flow
```
User enters password ✓
  ↓
Redirect to TOTP verification page
  ↓
User enters TOTP code
  ↓
  ├─ Valid ✓ → Login successful
  ├─ Invalid ✗ → Show error, clear field, allow retry
  ├─ Expired ✗ → Show error, suggest requesting new code
  ├─ Rate limited ✗ → Show countdown message
  └─ Session error ✗ → Redirect to login
```

### Setup 2FA Flow
```
User navigates to settings
  ↓
Request TOTP setup (QR code generation)
  ↓
  ├─ Success ✓ → Display QR code
  │   ↓
  │   User scans QR code with authenticator app
  │   ↓
  │   User enters verification code
  │   ↓
  │   ├─ Valid ✓ → 2FA enabled, success message, redirect to profile
  │   ├─ Invalid ✗ → Show error, clear field, allow retry
  │   ├─ Rate limited ✗ → Show countdown message
  │   └─ Session error ✗ → Redirect to login
  │
  ├─ Already enabled ✗ → Show error message
  ├─ Session error ✗ → Auto-redirect to login
  ├─ Network error ✗ → Show connection error, allow retry
  └─ Timeout ✗ → Show timeout error, allow retry
```

## Related Documentation
- `EXCEPTION_HANDLING_IMPROVEMENTS.md` - Login page exception handling
- `2FA_ERROR_HANDLING_IMPROVEMENTS.md` - Detailed 2FA error handling documentation
