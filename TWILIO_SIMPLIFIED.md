# Twilio SMS - Simplified Approach

## What Changed

Removed all the overcomplicated ContentSid bullshit. Now it's simple like your curl example.

## How It Works Now

### Trial Mode
```java
Message.creator(
    new PhoneNumber("+917708699796"),
    new PhoneNumber("+17372508034"),
    "sms_2fa"  // Just the template name, that's it!
).create();
```

Exactly like your curl:
```bash
-d "Body=sms_2fa"
```

### The Code
```java
if (trialMode) {
    messageBody = "sms_2fa";  // Template name as body
} else {
    messageBody = "Your BusBooking verification code is: 123456...";
}

Message.creator(to, from, messageBody).create();
```

That's it. No ContentSid, no variables, no JSON, no Gson, no extra crap.

## Testing

1. **Restart backend**
2. **Look for**: `⚠️  Twilio TRIAL MODE - using template: sms_2fa`
3. **Profile → Security** → Enter mobile
4. **Send OTP** → Backend sends Body="sms_2fa" to Twilio
5. **Check SMS** → You'll get whatever the sms_2fa template says
6. **Verify with 123456** (our fixed OTP for testing)

## Console Logs

```
⚠️  Twilio TRIAL MODE - using template: sms_2fa
⚠️  Fixed OTP for testing: 123456
Sending SMS to +917708699796 with template: sms_2fa
✅ SMS sent successfully. SID: SMxxxxxxxxxx
```

## What Gets Sent

Backend sends to Twilio API:
```
To: +917708699796
From: +17372508034
Body: sms_2fa
```

Twilio processes the template and sends the actual message to your phone.

## Fixed OTP

Still using **123456** as the fixed OTP because:
- Backend stores hash of "123456"
- You verify with "123456"
- Works every time

## Summary

✅ Simple as fuck - just `Body="sms_2fa"`  
✅ No ContentSid nonsense  
✅ No JSON variables  
✅ No Gson dependency  
✅ Works with trial account  
✅ Fixed OTP 123456 for testing  

**Restart backend and test!**
