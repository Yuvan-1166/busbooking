# Quick Reference Card - Message Central VerifyNow

## 🚀 Start Application
```bash
cd busbooking
mvnw spring-boot:run
```

## 📱 API Endpoints

### Send OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "7708699796"}'
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "data": {
      "verificationId": "12659709"
    }
  }
}
```

### Validate OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/validate-otp \
  -H "Content-Type: application/json" \
  -d '{"verificationId": "12659709", "code": "8306"}'
```

**Success Response:**
```json
{
  "success": true,
  "message": "OTP validated successfully",
  "data": {
    "valid": true
  }
}
```

## 🔧 Configuration

**.env file location:**
```
busbooking/.env
```

**Required variables:**
```
MC_CUSTOMER_ID=C-018916A1A7A84D2
MC_AUTH_TOKEN=eyJhbGciOi...
```

## 📋 Request Validation

| Field | Format | Example |
|-------|--------|---------|
| Mobile Number | 10 digits | 7708699796 |
| Verification ID | Numeric string | 12659709 |
| OTP Code | 4-6 digits | 8306 |

## ✅ HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request / Invalid OTP |
| 401 | Unauthorized (token issue) |
| 500 | Server error |

## 🔐 Environment Setup

1. **Get token from Message Central:**
   - Go to https://www.messagecentral.com
   - Login
   - Dashboard → API → Get Auth Token
   - Copy token

2. **Create `.env` file:**
   ```properties
   MC_CUSTOMER_ID=C-018916A1A7A84D2
   MC_AUTH_TOKEN=<paste_token_here>
   ```

3. **Rebuild application:**
   ```bash
   mvnw clean install
   ```

## 🐛 Debugging

**Check logs for:**
```
INFO - Auth token set in validateOtp: true
INFO - Request method: GET
INFO - Response Status: 200
```

**Common errors:**
- `401 UNAUTHORIZED` → Check `.env` has valid token
- `Validation failed` → Check mobile number is 10 digits
- `Verification ID not found` → Use correct ID from send-otp response

## 📚 Documentation Files

- `COMPLETE_IMPLEMENTATION.md` - Full implementation details
- `VERIFYNOW_README.md` - Complete API reference
- `FINAL_FIX_GET_METHOD.md` - Latest fixes explanation

## 🎯 Integration Code Example

```java
@Autowired
private VerifyNowOtpService otpService;

// Send OTP
OtpSendResponse sendResponse = otpService.sendOtp("7708699796");
String verificationId = sendResponse.getData().getData().getVerificationId();

// Validate OTP
OtpValidateResponse validateResponse = otpService.validateOtp(verificationId, "8306");
boolean isValid = validateResponse.getData() != null 
    && "VERIFICATION_COMPLETED".equalsIgnoreCase(
        validateResponse.getData().getVerificationStatus()
    );
```

## ✨ What's Implemented

✅ Static auth token (no generation)  
✅ Query parameters in URL  
✅ Correct HTTP methods (POST for send, GET for validate)  
✅ Request validation  
✅ Error handling  
✅ Security best practices  
✅ Comprehensive logging  

---

**Status:** ✅ PRODUCTION READY | **Build:** ✅ SUCCESS | **Tests:** ✅ PASSING
