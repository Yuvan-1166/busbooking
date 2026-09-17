# Mobile Verification - Error Handling Test Guide

## Overview

Comprehensive error handling improvements for mobile verification feature that shows user-friendly messages instead of raw JSON or status codes.

## What Was Improved

### Backend Enhancements

1. **MobileVerificationException** (`user/exception/MobileVerificationException.java`)
   - Custom exception for mobile verification operations
   - Provides clear exception hierarchy

2. **GlobalExceptionHandler** (`common/exception/GlobalExceptionHandler.java`)
   - Added `IllegalArgumentException` handler for validation errors
   - Added general `Exception` handler as fallback
   - Returns structured JSON error responses with timestamp, status, and message

### Frontend Enhancements

1. **API Request Function** (`api.js`)
   - Enhanced error parsing to handle multiple response formats
   - Extracts error messages from JSON responses
   - Handles ErrorResponse format, validation errors, plain text
   - Graceful fallback when parsing fails

2. **Error Message Utility** (`utils/errorMessages.js`)
   - `getUserFriendlyErrorMessage()` - Context-aware error mapping
   - Maps technical errors to user-friendly messages
   - Supports contexts: 'send-otp', 'verify-otp', 'update-verification'
   - `formatValidationErrors()` - Formats validation errors

3. **ProfilePage Component** (`components/profile/ProfilePage.jsx`)
   - Integrated error message utility
   - Context-specific error handling for each operation
   - Clean error display with consistent styling

## Error Handling Flow

```
Backend Error
    ↓
GlobalExceptionHandler (catches exception)
    ↓
Returns JSON: { timestamp, status, message }
    ↓
Frontend api.js (parses error response)
    ↓
Extracts error message
    ↓
getUserFriendlyErrorMessage() (maps to user-friendly message)
    ↓
Display in UI (red error alert box)
```

## Test Scenarios

### Scenario 1: Invalid Mobile Number Format

**Test**: Try to send OTP with invalid phone number

**Steps**:
1. Edit profile and set phone to "123" (too short)
2. Go to Overview tab
3. Click "Verify Mobile Number"

**Expected**:
- ❌ **Before**: Raw error like "Validation failed: mobileNumber: Mobile number must be exactly 10 digits"
- ✅ **After**: "Invalid mobile number format. Please enter a valid 10-digit number."

### Scenario 2: Network Connection Error

**Test**: Try to send OTP with network disconnected

**Steps**:
1. Disconnect internet
2. Click "Verify Mobile Number"

**Expected**:
- ❌ **Before**: "Failed to fetch"
- ✅ **After**: "Unable to connect to the server. Please check your internet connection and try again."

### Scenario 3: Invalid OTP Code

**Test**: Enter wrong OTP code

**Steps**:
1. Send OTP successfully
2. Enter "000000" (wrong code)
3. Click "Verify OTP"

**Expected**:
- ❌ **Before**: JSON response or "VERIFICATION_FAILED"
- ✅ **After**: "Invalid OTP code. Please check the code and try again."

### Scenario 4: Expired OTP

**Test**: Wait for OTP to expire (2 minutes)

**Steps**:
1. Send OTP successfully
2. Wait 3+ minutes
3. Enter the OTP code
4. Click "Verify OTP"

**Expected**:
- ❌ **Before**: Raw error message
- ✅ **After**: "OTP has expired. Please request a new code."

### Scenario 5: Server Error (500)

**Test**: Backend returns 500 error

**Mock**: Temporarily stop backend or cause error

**Expected**:
- ❌ **Before**: "500 Internal Server Error"
- ✅ **After**: "A server error occurred. Please try again in a few moments."

### Scenario 6: Authentication Expired (401)

**Test**: Token expires during verification

**Steps**:
1. Let JWT token expire
2. Try to verify mobile

**Expected**:
- ❌ **Before**: "401 Unauthorized"
- ✅ **After**: "Your session has expired. Please log in again."

### Scenario 7: Rate Limiting

**Test**: Send too many OTP requests

**Steps**:
1. Click "Verify Mobile Number" multiple times quickly

**Expected**:
- ❌ **Before**: Raw rate limit error
- ✅ **After**: "Too many OTP requests. Please wait a few minutes and try again."

### Scenario 8: Already Verified

**Test**: Try to verify already verified number

**Steps**:
1. Successfully verify mobile
2. Try to verify again (if re-verification allowed)

**Expected**:
- ❌ **Before**: JSON error
- ✅ **After**: "Your mobile number is already verified."

### Scenario 9: MessageCentral Service Unavailable

**Test**: MessageCentral API is down

**Mock**: Invalid MessageCentral credentials or API issue

**Expected**:
- ❌ **Before**: Technical error message
- ✅ **After**: "Service temporarily unavailable. Please try again later."

### Scenario 10: Validation Error - Multiple Fields

**Test**: Backend returns multiple validation errors

**Expected**:
- ❌ **Before**: Complex JSON object
- ✅ **After**: Clear list of errors or combined message

## Error Message Examples

### Send OTP Context

| Technical Error | User-Friendly Message |
|----------------|----------------------|
| "mobileNumber: Invalid format" | "Invalid mobile number format. Please enter a valid 10-digit number." |
| "Rate limit exceeded" | "Too many OTP requests. Please wait a few minutes and try again." |
| "SMS delivery failed" | "Unable to send SMS. Please verify your mobile number and try again." |
| "Insufficient credits" | "Service temporarily unavailable. Please try again later." |

### Verify OTP Context

| Technical Error | User-Friendly Message |
|----------------|----------------------|
| "Invalid OTP" | "Invalid OTP code. Please check the code and try again." |
| "OTP expired" | "OTP has expired. Please request a new code." |
| "OTP already used" | "This OTP has already been used. Please request a new code." |
| "VERIFICATION_FAILED" | "Verification failed. Please check your OTP and try again." |

### Update Verification Context

| Technical Error | User-Friendly Message |
|----------------|----------------------|
| "User not found" | "User information not found. Please log in again." |
| "Already verified" | "Your mobile number is already verified." |
| "500 Internal Server Error" | "Failed to update verification status. Please try again." |

## UI Error Display

### Error Alert Box Style
```jsx
<div className="border border-[#d79b8b] bg-[#f7e5df] px-3 py-2 text-[10px] text-[#8c3e2d]">
  {errorMessage}
</div>
```

**Visual**:
- Light red background (#f7e5df)
- Dark red border (#d79b8b)
- Dark red text (#8c3e2d)
- Small font (10px)
- Padding for readability

### Success Alert Box Style
```jsx
<div className="border border-[#a5bea0] bg-[#e4eee1] px-3 py-2 text-[10px] text-green">
  {successMessage}
</div>
```

**Visual**:
- Light green background (#e4eee1)
- Green border (#a5bea0)
- Green text
- Consistent with error style

## Testing Checklist

- [ ] Invalid mobile number format shows friendly error
- [ ] Network error shows connection message
- [ ] Invalid OTP shows clear message
- [ ] Expired OTP detected and handled
- [ ] Server errors show retry message
- [ ] Authentication errors prompt re-login
- [ ] Rate limiting shows wait message
- [ ] Already verified status handled gracefully
- [ ] Service unavailable shows proper message
- [ ] All errors display in red alert box
- [ ] No raw JSON or status codes shown to user
- [ ] Error messages are actionable (tell user what to do)
- [ ] Loading states prevent multiple error triggers

## Verification Methods

### 1. Browser Console
Check console for:
- No unhandled promise rejections
- No error parsing failures
- Clean error objects logged

### 2. Network Tab
Check responses:
- Backend returns proper error format
- Frontend parses correctly
- No raw JSON passed to UI

### 3. User Experience
Verify:
- Error messages are clear
- Messages tell user what to do next
- No technical jargon
- Consistent styling

## Code Quality

### Backend
✅ Structured error responses with timestamp, status, message  
✅ Specific exception handlers for different error types  
✅ Logging for debugging without exposing to user  
✅ Consistent HTTP status codes  

### Frontend
✅ Centralized error parsing in api.js  
✅ Reusable error message utility  
✅ Context-aware error mapping  
✅ Graceful fallbacks  
✅ No error suppression  

## Edge Cases Handled

1. **Null/undefined errors**: Default friendly message
2. **Empty error messages**: Generic fallback
3. **JSON parsing failures**: Graceful fallback to text
4. **Mixed content types**: Auto-detect and parse
5. **Long technical messages**: Map to concise friendly version
6. **User-friendly backend messages**: Pass through unchanged
7. **Multiple validation errors**: Format as readable list

## Before vs After Comparison

### Before
```
Error: {"timestamp":"2026-09-17T15:00:00","status":400,"message":"Validation failed","errors":{"mobileNumber":"Mobile number must be exactly 10 digits"}}
```

### After
```
Invalid mobile number format. Please enter a valid 10-digit number.
```

---

### Before
```
Error: 500 Internal Server Error: /api/verifynow/send-otp
```

### After
```
A server error occurred. Please try again in a few moments.
```

---

### Before
```
Error: VERIFICATION_FAILED
```

### After
```
Verification failed. Please check your OTP and try again.
```

## Success Criteria

✅ **No Raw Errors**: Users never see JSON, status codes, or technical messages  
✅ **Actionable Messages**: Every error tells user what to do  
✅ **Consistent Style**: All errors use same visual design  
✅ **Context-Aware**: Messages specific to the operation  
✅ **Graceful Degradation**: Unknown errors have safe fallback  
✅ **Good UX**: Clear, concise, helpful messages  

## Files Modified

### Backend
- `user/exception/MobileVerificationException.java` (new)
- `common/exception/GlobalExceptionHandler.java` (enhanced)

### Frontend
- `api.js` (enhanced error parsing)
- `utils/errorMessages.js` (new utility)
- `components/profile/ProfilePage.jsx` (integrated utility)

## Build Status

✅ **Backend**: Successfully compiled 201 source files  
✅ **Frontend**: No syntax errors, clean implementation

---

**Implementation Date**: September 17, 2026  
**Status**: ✅ Complete & Ready for Testing  
**Priority**: High (User Experience)
