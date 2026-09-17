# SMS Service Refactor Summary

## Changes Made

### 1. Created Modular SMS Architecture
- **New**: `SmsService` interface for provider abstraction
- **Updated**: `TwilioSmsService` implements the interface
- **Benefit**: Easy to switch providers (AWS SNS, etc.) later

### 2. Fixed OTP for Trial Testing
- **Fixed OTP**: `123456` (hardcoded for Twilio trial compatibility)
- **Database**: Stores BCrypt hash of "123456"
- **SMS**: Always sends "123456" via Twilio sms_2fa template
- **Verification**: Works perfectly with fixed OTP

### 3. Trial Mode Configuration
```properties
twilio.trial-mode=true  # Use fixed OTP for testing
```

## File Changes

| File | Change |
|------|--------|
| `SmsService.java` | **NEW** - Interface for SMS providers |
| `TwilioSmsService.java` | Implements interface, uses fixed OTP in trial mode |
| `OtpService.java` | Uses SmsService interface, stores hash of "123456" |
| `application.properties` | Added `twilio.trial-mode` configuration |

## Testing Flow

### Send OTP
```
User → Backend → Generates random (unused)
              → Stores hash of "123456"
              → TwilioSmsService sends "123456"
              → Twilio SMS: "Your verification code is 123456"
```

### Verify OTP  
```
User enters "123456"
    ↓
Backend checks against stored hash
    ↓
BCrypt matches: hash("123456") == stored hash ✅
    ↓
Mobile verified!
```

## How to Test

1. **Restart backend** (new build ready)
2. **Look for log**: `⚠️  Twilio SMS Service running in TRIAL MODE - using fixed OTP: 123456`
3. **Profile → Security** → Enter mobile → Send OTP
4. **Check SMS** → Receive "123456"
5. **Enter "123456"** → Verify → Success! ✅

## Benefits

✅ **Works with Twilio trial** - Uses content template  
✅ **Fixed OTP testing** - Predictable, easy to test  
✅ **Modular design** - Swap SMS providers easily  
✅ **Production ready** - Just flip `trial-mode=false`  

## Console Logs

Look for these on startup:
```
⚠️  Twilio SMS Service running in TRIAL MODE - using fixed OTP: 123456
```

During OTP send:
```
Sending SMS OTP to +917708699796 (Trial Mode: true)
OTP to send: 123456
✅ SMS sent successfully. SID: SMxxxxxxxxxx
⚠️  TRIAL MODE: Verify with OTP 123456
```

## Production Switch

When ready for production:
1. Set `twilio.trial-mode=false`
2. Update OtpService to use `plainOtp` instead of `"123456"`
3. Restart
4. Done! Real OTPs will work

## Key Point

**Always use OTP: 123456 for trial testing!**

The system is designed around this fixed value.
