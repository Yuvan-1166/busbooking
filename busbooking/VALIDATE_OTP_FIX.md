# Validate OTP 401 Error - Fix

## Status
✅ Send OTP working perfectly!  
❌ Validate OTP getting 401 error  

## What's Different

Your **working curl command:**
```bash
curl --location "https://cpaas.messagecentral.com/verification/v3/validateOtp?verificationId=12659436&code=3077" \
  --header "authToken: eyJhbGciOi..."
```

**Note:** The header is `authToken:` (exact case)

## Changes Made

### Updated `VerifyNowOtpService.java`
- Added more detailed logging for validate endpoint
- Creates fresh HttpHeaders for each validate request
- Logs token value (first 30 chars)
- Logs request headers before sending
- Logs response headers on error

## Test Steps

### Step 1: Rebuild
```bash
mvnw clean install
mvnw spring-boot:run
```

### Step 2: Send OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "7708699796"}'
```

**Response:**
```json
{
  "data": {
    "data": {
      "verificationId": "12659573",
      ...
    }
  }
}
```

Copy the `verificationId`.

### Step 3: Check OTP in Phone
Wait for SMS with OTP code (or check test account).

### Step 4: Validate OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/validate-otp \
  -H "Content-Type: application/json" \
  -d '{"verificationId": "12659573", "code": "1234"}'
```

### Step 5: Watch Console Logs
Look for these log lines:

**Good signs:**
```
INFO - Validating OTP for verification ID: 12659573
INFO - OTP Validate URL: https://cpaas.messagecentral.com/verification/v3/validateOtp?verificationId=12659573&code=****
INFO - Auth token set in validateOtp: true
INFO - Auth token value (first 30 chars): eyJhbGciOiJIUzUxMiJ9.eyJzdWI...
INFO - Request headers: [authToken="eyJhbGciOi..."]
```

**If you see 401:**
```
ERROR - HTTP error while validating OTP: 401 UNAUTHORIZED
```

## Possible Issues & Solutions

### Issue 1: Token Not Set
**Log shows:** `Auth token set in validateOtp: false`

**Solution:**
- Check `.env` file has `MC_AUTH_TOKEN`
- Restart app
- Rebuild: `mvnw clean install`

### Issue 2: Token Expired
**Log shows:** Token is set but still 401

**Solution:**
1. Go to https://www.messagecentral.com
2. Generate NEW auth token
3. Update `.env`
4. Restart app

### Issue 3: Verification ID Invalid
**Error:** "Verification ID not found"

**Solution:**
- Make sure you copied verification ID correctly from send-otp response
- Use it immediately (IDs expire after ~24 hours)

### Issue 4: OTP Code Wrong
**Error:** "Invalid OTP code"

**Solution:**
- Wait for SMS
- Check correct code was received
- Enter exactly what was received

## What I've Added

✅ **Fresh headers for validate:** Creates new HttpHeaders per request  
✅ **Better token logging:** Shows token value (first 30 chars)  
✅ **Request logging:** Logs full headers before sending  
✅ **Error logging:** Logs response headers on 401

## If Still Fails

Collect these logs and check:
1. `Auth token value (first 30 chars):` - Should show JWT start
2. `Request headers:` - Should have `authToken="eyJhbGciOi..."`
3. `Response Status:` - Should show status code
4. `HTTP error:` - Full error message

Then verify:
- Token is valid on Message Central dashboard
- Verification ID is correct
- OTP code is correct
- Account has sufficient credits

---

**Build Status:** ✅ SUCCESS

Try testing now! The enhanced logging will help identify the exact issue if it persists.
