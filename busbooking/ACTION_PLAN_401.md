# Action Plan: Fix 401 Unauthorized Error

## Current Status
✅ Code compiles successfully  
❌ Getting 401 when calling `/api/verifynow/send-otp`  
✅ Added detailed logging to diagnose the issue  

## What We Know
- Request is reaching Message Central API
- Auth token is **NOT** being accepted (401 = Unauthorized)
- Possible causes:
  1. Token not loaded from `.env`
  2. Token is expired/revoked
  3. Customer ID mismatch
  4. Account/credit issue

## Next Steps (In Order)

### Step 1: Verify `.env` File
```bash
# Windows PowerShell - Show .env file content
Get-Content busbooking\.env
```

**Should show:**
```
MC_CUSTOMER_ID=C-018916A1A7A84D2
MC_AUTH_TOKEN=eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJDLTAxODkxNkExQTdBODREMiIsImlhdCI6MTc4OTYyMTAwOSwiZXhwIjoxOTQ3MzAxMDA5fQ.jtqqtYyGbT5RqiYY7A0FFqveU1yw_bflo3xaO0TXMdoXh3Hb3a7z6yk6IJxasD7vz-pL2IDkLDISgc8Cy6xvIA
```

### Step 2: Rebuild & Restart
```bash
cd busbooking
mvnw clean install
mvnw spring-boot:run
```

### Step 3: Watch Console Logs
Look for these messages:
```
✅ Using configured auth token: eyJhbGciOiJIUzUxMiJ9...
✅ OTP Request: countryCode=91, customerId=C-018916A1A7A84D2, flowType=SMS, mobileNumber=...
✅ Auth token present: true
✅ Making API call to: https://cpaas.messagecentral.com/verification/v3/send
```

If you see:
- ❌ "Auth token not configured" → `.env` NOT loaded
- ❌ "Auth token present: false" → Token is null/empty

### Step 4: Test Again
```bash
curl -X POST http://localhost:8080/api/verifynow/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9876543210"}'
```

Replace `9876543210` with an actual 10-digit mobile number.

### Step 5: If Still 401
Check your Message Central account:
1. Go to https://www.messagecentral.com
2. Login with your credentials
3. Verify:
   - Account Status: **Active** ✓
   - SMS Credits: **> 0** ✓
   - Customer ID: **C-018916A1A7A84D2** ✓
4. If anything is wrong, get a **new auth token** from dashboard
5. Update `.env` with new token
6. Restart app and test again

## Debugging File
See `DEBUG_401_UNAUTHORIZED.md` for detailed troubleshooting.

## Expected Success Response
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "responseCode": 200,
    "message": "SUCCESS",
    "data": {
      "verificationId": "uuid-here",
      "mobileNumber": "9876543210",
      "transactionId": "txn_xxx"
    }
  }
}
```

## What I've Updated in Code

✅ **Added logging to track:**
- Token loading status
- Request parameters
- API URL being called
- Auth header presence

✅ **Updated files:**
- `MessageCentralAuthService.java` - Better token validation & logging
- `VerifyNowOtpService.java` - Detailed request logging
- `OtpSendRequest.java` - Added @JsonInclude for clean JSON

✅ **Created new documentation:**
- `DEBUG_401_UNAUTHORIZED.md` - Complete troubleshooting guide

## Let me know:
1. Does your `.env` file have the token and customer ID?
2. What logs do you see when you restart and make the request?
3. What does Message Central dashboard show for your account status?

Once you provide this info, I can help narrow down the exact cause!
