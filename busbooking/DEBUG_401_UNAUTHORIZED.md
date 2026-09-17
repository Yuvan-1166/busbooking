# 401 Unauthorized Error - Debugging Guide

## Issue
You're getting a **401 UNAUTHORIZED** error when calling the OTP send endpoint.

## Root Causes & Solutions

### 1. ✅ Check `.env` File is Loaded

**Verify your `.env` file exists:**
```bash
# Should exist in: busbooking/.env
# Contents should be:
MC_CUSTOMER_ID=C-018916A1A7A84D2
MC_AUTH_TOKEN=eyJhbGciOiJIUzUxMiJ9...
```

**On Windows (PowerShell):**
```powershell
Get-Content busbooking\.env
```

### 2. ✅ Check Auth Token is Being Sent

The updated code now logs this. Look for in your console:

```
Auth token present: true
Making API call to: https://cpaas.messagecentral.com/verification/v3/send
```

If you see `Auth token present: false`, the token is **not loaded from .env**.

### 3. ✅ Verify Token Format

Your token should start with `eyJhbGciOi...` (JWT format).

The logs show masked token:
```
Using configured auth token: eyJhbGciOiJIUzUxMiJ9...
```

### 4. ⚠️ Common Issues

**Issue: "Auth token not configured"**
```
[ERROR] Auth token not configured. Set MC_AUTH_TOKEN environment variable.
```

**Solution:**
- Restart your IDE/terminal after adding `.env`
- Rebuild: `mvnw clean install`
- Make sure `.env` is in `busbooking/` directory (not root)

**Issue: Token is loaded but still 401**

The Message Central API might expect:
- ✅ Check token is still valid on Message Central website
- ✅ Verify customer ID matches
- ✅ Check if you have SMS credits

### 5. ✅ Verify Request Parameters

Look for log output like:
```
OTP Request: countryCode=91, customerId=C-018916A1A7A84D2, flowType=SMS, mobileNumber=******9796
```

All fields should be **populated**. If any are empty:
- Check `.env` has `MC_CUSTOMER_ID`
- Check you're sending 10-digit mobile number

### 6. ✅ Test Token Directly

Create a simple test endpoint to verify token loads:

```java
@GetMapping("/api/verifynow/test-token")
public ResponseEntity<?> testToken() {
    try {
        String token = authService.getAuthToken();
        return ResponseEntity.ok(Map.of(
            "token_loaded", token != null && !token.isEmpty(),
            "token_length", token != null ? token.length() : 0,
            "token_preview", token != null && token.length() > 20 
                ? token.substring(0, 20) + "..." 
                : "***"
        ));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", e.getMessage()));
    }
}
```

Call it:
```bash
curl http://localhost:8080/api/verifynow/test-token
```

### 7. ✅ Debugging Steps

**Step 1:** Stop the app and rebuild
```bash
mvnw clean install
```

**Step 2:** Start with extra logging
```bash
mvnw spring-boot:run
```

**Step 3:** Watch for these log lines:
```
Using configured auth token: eyJhbGciOiJIUzUxMiJ9...
OTP Request: countryCode=91, customerId=C-018916A1A7A84D2, flowType=SMS, mobileNumber=...
Auth token present: true
Making API call to: https://cpaas.messagecentral.com/verification/v3/send
```

**Step 4:** If you see all above but still 401, the issue is with:
- Token validity on Message Central
- Customer ID mismatch
- Account/credit issues

### 8. ✅ Message Central Portal Check

Log into https://www.messagecentral.com and verify:
1. **Account Status:** Active
2. **API Credits:** > 0
3. **Customer ID:** `C-018916A1A7A84D2` (matches your .env)
4. **Auth Token:** Still valid (doesn't expire, but can be revoked)

### 9. ✅ Full Test Checklist

```
☐ .env file exists in busbooking/ directory
☐ MC_AUTH_TOKEN has full JWT token (not truncated)
☐ MC_CUSTOMER_ID=C-018916A1A7A84D2
☐ Application rebuilt after .env created
☐ Logs show "Auth token present: true"
☐ Logs show "Using configured auth token: ..."
☐ Message Central account is active
☐ Account has SMS credits
☐ Mobile number is 10 digits (without country code)
☐ Request sent to correct URL (/verification/v3/send)
```

### 10. ✅ If Still 401 After All Above

The token might have been revoked or regenerated. **Get a new token:**

1. Go to https://www.messagecentral.com
2. Dashboard → API → Get Auth Token
3. Copy the new token
4. Update `.env` file:
   ```properties
   MC_AUTH_TOKEN=<new_token_here>
   ```
5. Restart app: `mvnw spring-boot:run`
6. Test again

## Full Console Output Example

**What you SHOULD see:**

```
INFO  - Using configured auth token: eyJhbGciOiJIUzUxMiJ9...
INFO  - OTP Request: countryCode=91, customerId=C-018916A1A7A84D2, flowType=SMS, mobileNumber=******9796
INFO  - Auth token present: true
INFO  - Making API call to: https://cpaas.messagecentral.com/verification/v3/send
INFO  - OTP sent successfully. Verification ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**What you're currently seeing:**

```
ERROR - HTTP error while sending OTP: 401 UNAUTHORIZED
```

This means request is being made but token is either:
- ❌ Missing from headers
- ❌ Invalid/revoked
- ❌ Not matching customer ID
- ❌ Account issue

## Next Actions

1. Verify `.env` file content
2. Restart application completely
3. Check logs for "Auth token present: true"
4. If still failing, get new token from Message Central dashboard
5. Verify account has SMS credits

---

**Support:** If issue persists after all checks, collect these logs and verify:
- Full token is in `.env` (not truncated)
- Token matches customer ID from Message Central portal
- Account is active with sufficient credits
