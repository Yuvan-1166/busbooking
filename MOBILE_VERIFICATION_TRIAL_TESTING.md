# Mobile Verification Testing Guide - Fixed OTP for Trial

## Overview
The SMS service is now **modular and trial-ready** with a fixed OTP (`123456`) for Twilio trial account testing.

## What Changed

### 1. Modular Architecture ✨
Created `SmsService` interface for easy provider switching:
```
SmsService (interface)
    ├── TwilioSmsService (current implementation)
    ├── AwsSnsService (future)
    └── OtherProvider (future)
```

### 2. Fixed OTP for Trial Testing 🔧
- **OTP Sent via SMS**: Always `123456` (hardcoded in TwilioSmsService)
- **OTP Stored in DB**: BCrypt hash of `123456`
- **Verification**: Works with `123456` regardless of what was "generated"

### 3. Trial Mode Configuration
```properties
twilio.trial-mode=true  # Uses fixed OTP 123456
# Set to false when switching to production
```

## How It Works

### Trial Mode Flow (Current Setup)
```
User clicks "Send OTP"
    ↓
Backend generates random OTP (e.g., 891234) [not used]
    ↓
Backend stores BCrypt hash of "123456" in database
    ↓
TwilioSmsService overrides with fixed OTP "123456"
    ↓
Twilio sends SMS with "123456" via sms_2fa template
    ↓
User receives: "Your verification code is 123456"
    ↓
User enters "123456" in form
    ↓
Backend verifies against stored hash ✅ Match!
    ↓
Mobile marked as verified
```

### Production Mode Flow (Future)
```
User clicks "Send OTP"
    ↓
Backend generates random OTP (e.g., 891234)
    ↓
Backend stores BCrypt hash of "891234"
    ↓
TwilioSmsService sends actual OTP "891234"
    ↓
User receives: "Your BusBooking verification code is 891234..."
    ↓
User verifies with actual code
```

## Testing Instructions

### Step 1: Restart Backend
```bash
# Stop current backend
# Rebuild if needed: mvn clean package -DskipTests
# Start backend
```

Look for this log message on startup:
```
⚠️  Twilio SMS Service running in TRIAL MODE - using fixed OTP: 123456
```

### Step 2: Test Mobile Verification

1. **Login** to application
2. **Navigate** to Profile → Security tab
3. **Enter mobile**: `+917708699796` (your verified Twilio number)
4. **Click** "Send OTP"
5. **Check SMS** on your phone - should receive "123456"
6. **Backend logs** will show:
   ```
   Sending SMS OTP to +917708699796 (Trial Mode: true)
   OTP to send: 123456
   ⚠️  TRIAL MODE: Verify with OTP 123456
   ✅ SMS sent successfully. SID: SM...
   ```
7. **Enter** `123456` in the verification form
8. **Click** "Verify OTP"
9. **Success!** Mobile should be marked as verified

### Step 3: Verify in Database
```sql
SELECT email, mobile_number, mobile_verified, mobile_verified_at 
FROM users 
WHERE email = 'your.email@example.com';
```

Should show:
- `mobile_number`: `+917708699796`
- `mobile_verified`: `1` (true)
- `mobile_verified_at`: timestamp

## Key Points

### Fixed OTP = "123456"
- **Always use this code** for verification during trial testing
- Backend expects exactly `123456`
- Don't try to use the randomly generated code - it won't work!

### Modular Design
To switch SMS providers later:
1. Create new class implementing `SmsService`
2. Annotate with `@Service("yourProvider")`
3. Update dependency injection
4. No changes needed to OtpService!

### Trial Mode Flag
```properties
# Trial (current)
twilio.trial-mode=true

# Production (future)
twilio.trial-mode=false
```

## Console Logs to Watch

### Successful Send
```
⚠️  Twilio SMS Service running in TRIAL MODE - using fixed OTP: 123456
Sending SMS OTP to +917708699796 (Trial Mode: true)
OTP to send: 123456
✅ SMS sent successfully. SID: SMxxxxxxxxxxxxxxxxxxxxxxxxxx
⚠️  TRIAL MODE: Verify with OTP 123456
```

### Successful Verification
```
User verifying mobile OTP
OTP verification successful
Mobile number verified for user: your.email@example.com
```

### Common Errors

#### "Phone number not verified"
- Go to Twilio Console → Verified Caller IDs
- Add +917708699796 if not there

#### "Incorrect code"
- Make sure you're entering **123456**, not a different code
- Check backend logs confirm trial mode is active

#### "Too many attempts"
- Request a new OTP (will still be 123456)
- Previous attempts counter resets

## Switching to Production

When you upgrade to paid Twilio account:

### 1. Update Configuration
```properties
twilio.trial-mode=false
```

### 2. Update OtpService
In `generateAndSendMobileOtp()`, change:
```java
// Remove these lines:
String otpForDb = "123456";
record.setOtpHash(passwordEncoder.encode(otpForDb));

// Keep original:
record.setOtpHash(passwordEncoder.encode(plainOtp));
```

### 3. Update TwilioSmsService
The service will automatically use the actual OTP when `trialMode=false`.

### 4. Restart Backend
The system will now generate and send random 6-digit OTPs.

## Architecture Benefits

### Easy Provider Switching
```java
// Current: Twilio
@Service
public class TwilioSmsService implements SmsService { ... }

// Future: AWS SNS
@Service
public class AwsSnsService implements SmsService { ... }

// Future: Custom provider
@Service  
public class CustomSmsService implements SmsService { ... }
```

Just change which implementation is active!

### Consistent Interface
```java
public interface SmsService {
    void sendOtp(String toPhoneNumber, String otp, int expiryMinutes);
}
```

All providers must implement this contract.

## Quick Reference

| Aspect | Trial Mode | Production Mode |
|--------|-----------|-----------------|
| **OTP Value** | Always `123456` | Random 6-digit |
| **SMS Template** | sms_2fa (Twilio) | Custom message |
| **Configuration** | `trial-mode=true` | `trial-mode=false` |
| **Cost** | Free (trial) | ~$0.0075/SMS |
| **Phone Verification** | Required | Not required |
| **Custom Messages** | Not supported | Supported |

## Summary

✅ **Modular SMS architecture** - easy to swap providers  
✅ **Fixed OTP `123456`** - works with Twilio trial  
✅ **Backend hash matches** - verification will succeed  
✅ **Trial mode flag** - easy production switch  
✅ **Build successful** - ready to test  

**Test with OTP: 123456** 🔑

Restart your backend and test the mobile verification flow!
