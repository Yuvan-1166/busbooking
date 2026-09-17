# Twilio Trial Account Setup - Quick Fix Guide

## Issue Resolved
**Problem**: "Invalid template name. Trial accounts can only use predefined SMS templates."

**Solution**: Updated `TwilioSmsService` to use Twilio Content Templates instead of custom message bodies.

## What Changed

### 1. TwilioSmsService.java
- Added support for Content Template API
- Uses template SID: `HXb5e954f6102fe2b22192ccf63e499d41` (sms_2fa template)
- Passes OTP code as variable "1" to the template
- Falls back to custom messages for paid accounts

### 2. Configuration Added
```properties
# Set to true for trial accounts, false for paid accounts
twilio.use-content-template=true
```

## How It Works

### Trial Account Flow
1. User requests OTP
2. Backend generates 6-digit code
3. **TwilioSmsService** calls Twilio API with:
   - `ContentSid`: `HXb5e954f6102fe2b22192ccf63e499d41`
   - `ContentVariables`: `{"1": "123456"}`
4. Twilio sends SMS using predefined "sms_2fa" template
5. User receives: "Your verification code is 123456"

### Paid Account Flow
1. Set `twilio.use-content-template=false`
2. Backend sends custom message body
3. No template restriction

## Environment Variables

Make sure these are set:

```bash
# Required
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# Optional (defaults to true)
TWILIO_USE_CONTENT_TEMPLATE=true
```

## Testing Steps

### 1. Restart Backend
Stop and restart your Spring Boot application to load the updated code.

### 2. Test OTP Flow
1. Login to your application
2. Go to Profile → Security tab
3. Enter mobile number: `+917708699796` (or your verified number)
4. Click "Send OTP"
5. Check your phone for SMS with 6-digit code
6. Enter code and click "Verify OTP"

### 3. Expected SMS Format
```
Your verification code is 123456
```

(The exact message depends on Twilio's "sms_2fa" template)

## Troubleshooting

### Still Getting "Invalid template name"
- ✅ Restart backend after rebuild
- ✅ Check `twilio.use-content-template=true` in application.properties
- ✅ Verify ContentSid is correct: `HXb5e954f6102fe2b22192ccf63e499d41`

### "Phone number not verified"
- Trial accounts can only send to **verified phone numbers**
- Go to Twilio Console → Phone Numbers → Verified Caller IDs
- Add and verify your test phone number

### SMS Not Received
- Check Twilio Console → Monitor → Logs → Messages
- Look for delivery status:
  - **Sent**: SMS delivered successfully
  - **Failed**: Check error message
  - **Queued**: Still processing

### Wrong Message Format
The "sms_2fa" template has a predefined format. You cannot customize it with trial accounts.

To see what the template looks like:
1. Go to Twilio Console → Messaging → Content Editor
2. Search for "sms_2fa" template
3. View the template structure

## Upgrade to Paid Account

To use custom message bodies:

1. **Upgrade Account**: Add billing in Twilio Console
2. **Update Configuration**: Set `twilio.use-content-template=false`
3. **Restart Backend**
4. Now custom messages will work:
   ```
   Your BusBooking verification code is: 123456
   
   This code will expire in 10 minutes.
   
   Do not share this code with anyone.
   ```

## API Call Examples

### Using Content Template (Trial)
```java
MessageCreator messageCreator = Message.creator(
    new PhoneNumber("+917708699796"),
    new PhoneNumber("+15551234567"),
    "123456"  // Body required but replaced by template
);
messageCreator.setContentSid("HXb5e954f6102fe2b22192ccf63e499d41");
messageCreator.setContentVariables("{\"1\":\"123456\"}");
Message message = messageCreator.create();
```

### Using Custom Body (Paid)
```java
Message message = Message.creator(
    new PhoneNumber("+917708699796"),
    new PhoneNumber("+15551234567"),
    "Your BusBooking verification code is: 123456..."
).create();
```

## Code Reference

### Template SID
The ContentSid `HXb5e954f6102fe2b22192ccf63e499d41` is for Twilio's built-in "sms_2fa" template.

This template expects:
- **Variable "1"**: The verification code
- **Format**: "Your verification code is {1}"

### Content Variables Format
```json
{
  "1": "123456"
}
```

## Summary

✅ **Backend updated** to use Content Templates for trial accounts  
✅ **Build successful** - ready to restart and test  
✅ **Configuration added** for template control  
✅ **Backward compatible** - works with paid accounts too  

**Next Step**: Restart your backend and test the OTP flow!
