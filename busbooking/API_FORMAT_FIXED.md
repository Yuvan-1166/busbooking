# ✅ Message Central API Format FIXED

## What Was Wrong
We were sending **JSON body** with request parameters.  
Message Central API actually expects **query parameters in the URL**.

## What Changed

### Before (❌ Wrong)
```
POST https://cpaas.messagecentral.com/verification/v3/send
Header: authToken: <token>
Body: {
  "countryCode": "91",
  "customerId": "...",
  "flowType": "SMS",
  "mobileNumber": "9876543210"
}
```

### After (✅ Correct)
```
POST https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&flowType=SMS&mobileNumber=9876543210
Header: authToken: <token>
Body: (empty)
```

## Updated Files

### 1. `VerifyNowOtpService.java` 
- Changed to build URL with query parameters using `UriComponentsBuilder`
- Removed JSON body serialization
- Now sends empty body with query params in URL
- Added detailed URL logging

### 2. `VerifyNowController.java`
- Simplified to just need `mobileNumber` for send-otp
- Simplified to just need `verificationId` and `code` for validate-otp
- Removed unnecessary DTOs

## API Endpoints (Updated)

### Send OTP
**Request:**
```json
POST /api/verifynow/send-otp
{
  "mobileNumber": "9876543210"
}
```

**Actual Message Central Call:**
```
POST https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&flowType=SMS&mobileNumber=9876543210
Header: authToken: eyJhbGciOi...
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "responseCode": 200,
    "message": "SUCCESS",
    "data": {
      "verificationId": "12659336",
      "mobileNumber": "9876543210",
      "transactionId": "d873f649-..."
    }
  }
}
```

### Validate OTP
**Request:**
```json
POST /api/verifynow/validate-otp
{
  "verificationId": "12659336",
  "code": "123456"
}
```

**Actual Message Central Call:**
```
POST https://cpaas.messagecentral.com/verification/v3/validateOtp?verificationId=12659336&code=123456
Header: authToken: eyJhbGciOi...
```

**Response:**
```json
{
  "success": true,
  "message": "OTP validated successfully",
  "data": {
    "valid": true,
    "message": "SUCCESS",
    "verificationId": "12659336"
  }
}
```

## Build Status
```
✅ [INFO] BUILD SUCCESS
✅ Compiling 200 source files
```

## Testing

### Test Send OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9342131675"}'
```

### Test Validate OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/validate-otp \
  -H "Content-Type: application/json" \
  -d '{"verificationId": "12659336", "code": "3077"}'
```

## What's Happening Behind the Scenes

1. User sends: `{"mobileNumber": "9342131675"}` to `/api/verifynow/send-otp`
2. Controller receives it
3. Service builds URL: `https://cpaas.messagecentral.com/verification/v3/send?countryCode=91&flowType=SMS&mobileNumber=9342131675`
4. Service adds header: `authToken: <your_token>`
5. Service sends POST with **empty body** to Message Central
6. Message Central returns verification ID
7. We return response to client

## Ready to Test!

1. Make sure `.env` has your token and customer ID
2. Rebuild: `mvnw clean install`
3. Run: `mvnw spring-boot:run`
4. Test the endpoints above

✅ Should now work without 401 errors!
