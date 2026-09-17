# Message Central VerifyNow API Integration

Production-ready Spring Boot integration with Message Central VerifyNow API for OTP verification via SMS.

## Features

- ✅ **Authentication Token Management** - Automatic token generation and caching (55-minute cache)
- ✅ **OTP Send** - Send OTP to mobile numbers via SMS
- ✅ **OTP Validation** - Verify OTP codes
- ✅ **Token Caching** - Caffeine cache for efficient token reuse
- ✅ **Error Handling** - Comprehensive exception handling with meaningful responses
- ✅ **Request Validation** - Jakarta Bean Validation on all endpoints
- ✅ **Security** - No credentials in code, mobile number masking in logs
- ✅ **Logging** - Detailed logging for debugging and monitoring

## Architecture

```
com.yuvan.busbooking.verifynow/
├── config/
│   ├── MessageCentralConfig.java      # Configuration properties
│   └── RestTemplateConfig.java        # RestTemplate & Cache setup
├── controller/
│   └── VerifyNowController.java       # REST API endpoints
├── dto/
│   ├── ApiResponse.java               # Generic success response
│   ├── ErrorResponse.java             # Error response wrapper
│   ├── AuthTokenRequest.java          # Auth request DTO
│   ├── AuthTokenResponse.java         # Auth response DTO
│   ├── OtpSendRequest.java            # OTP send request DTO
│   ├── OtpSendResponse.java           # OTP send response DTO
│   ├── OtpValidateRequest.java        # OTP validate request DTO
│   └── OtpValidateResponse.java       # OTP validate response DTO
├── exception/
│   ├── MessageCentralException.java              # Base exception
│   ├── MessageCentralAuthenticationException.java # Auth errors
│   ├── VerifyNowOtpException.java                # OTP errors
│   └── VerifyNowExceptionHandler.java            # Global handler
└── service/
    ├── MessageCentralAuthService.java  # Authentication & token caching
    └── VerifyNowOtpService.java        # OTP operations
```

## Setup Instructions

### 1. Configure Environment Variables

Add the following to your `.env` file or environment variables:

```properties
# Message Central Credentials
MC_CUSTOMER_ID=your_customer_id
MC_EMAIL=your_email@example.com
MC_PASSWORD=your_password

# Optional - URLs (defaults provided)
MC_AUTH_URL=https://cpaas.messagecentral.com/auth/v1/authentication/token
MC_VERIFYNOW_BASE_URL=https://cpaas.messagecentral.com/verification/v3
MC_DEFAULT_COUNTRY_CODE=91
```

### 2. Configuration Properties

The integration uses `application.properties` for configuration:

```properties
# Message Central VerifyNow API
app.messagecentral.auth-url=${MC_AUTH_URL:https://cpaas.messagecentral.com/auth/v1/authentication/token}
app.messagecentral.customer-id=${MC_CUSTOMER_ID:}
app.messagecentral.email=${MC_EMAIL:}
app.messagecentral.password=${MC_PASSWORD:}
app.messagecentral.verifynow.base-url=${MC_VERIFYNOW_BASE_URL:https://cpaas.messagecentral.com/verification/v3}
app.messagecentral.verifynow.country-code=${MC_DEFAULT_COUNTRY_CODE:91}
app.messagecentral.token-cache-duration=55
```

### 3. Dependencies

Already added to `pom.xml`:

```xml
<!-- Caffeine Cache for token caching -->
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

### 4. Build and Run

```bash
# Build the project
cd busbooking
mvnw clean install

# Run the application
mvnw spring-boot:run
```

## API Endpoints

### Base URL
```
http://localhost:8080/api/verifynow
```

### 1. Send OTP

**Endpoint:** `POST /api/verifynow/send-otp`

**Request:**
```json
{
  "mobileNumber": "9876543210"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "responseCode": 200,
    "message": "SUCCESS",
    "data": {
      "verificationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "mobileNumber": "9876543210",
      "responseCode": "200",
      "errorMessage": null,
      "timeout": "120",
      "smsCLI": null,
      "transactionId": "txn_123456789"
    }
  },
  "timestamp": "2026-09-17T12:00:00"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": null,
  "errors": [
    "mobileNumber: Mobile number must be exactly 10 digits"
  ],
  "timestamp": "2026-09-17T12:00:00"
}
```

### 2. Validate OTP

**Endpoint:** `POST /api/verifynow/validate-otp`

**Request:**
```json
{
  "verificationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "mobileNumber": "9876543210",
  "code": "123456"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP validated successfully",
  "data": {
    "valid": true,
    "message": "SUCCESS",
    "verificationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "timestamp": "2026-09-17T12:01:00"
}
```

**Invalid OTP Response (400 Bad Request):**
```json
{
  "success": true,
  "message": "OTP validation failed",
  "data": {
    "valid": false,
    "message": "VERIFICATION_FAILED",
    "verificationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "timestamp": "2026-09-17T12:01:00"
}
```

## Testing with cURL

### Send OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "mobileNumber": "9876543210"
  }'
```

### Validate OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/validate-otp \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "mobileNumber": "9876543210",
    "code": "123456"
  }'
```

## Testing with Postman

### 1. Send OTP

- **Method:** POST
- **URL:** `http://localhost:8080/api/verifynow/send-otp`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "mobileNumber": "9876543210"
}
```

### 2. Validate OTP

- **Method:** POST
- **URL:** `http://localhost:8080/api/verifynow/validate-otp`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "verificationId": "VERIFICATION_ID_FROM_SEND_RESPONSE",
  "mobileNumber": "9876543210",
  "code": "123456"
}
```

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request - Validation errors or OTP operation failed |
| 401 | Unauthorized - Authentication failed |
| 500 | Internal Server Error - Unexpected errors |

### Common Error Responses

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Authentication failed - invalid credentials",
  "errorCode": 401,
  "timestamp": "2026-09-17T12:00:00"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "mobileNumber: Mobile number must be exactly 10 digits"
  ],
  "timestamp": "2026-09-17T12:00:00"
}
```

## Token Caching

- Authentication tokens are cached for **55 minutes**
- Message Central tokens expire after 60 minutes
- Automatic token refresh on cache expiry
- Cache key: `messageCentralAuthToken::authToken`
- Cache implementation: **Caffeine**

### Cache Statistics

View cache statistics in logs:
```
Successfully obtained authentication token (expires in 3600 seconds)
```

## Security Best Practices

✅ **Never commit credentials** - Always use environment variables  
✅ **Mobile number masking** - Only last 4 digits shown in logs  
✅ **Secure token storage** - Tokens cached in memory, not persisted  
✅ **HTTPS in production** - Use SSL/TLS for API calls  
✅ **Rate limiting** - Implement rate limiting for OTP endpoints

## Validation Rules

### Mobile Number
- Required
- Exactly 10 digits
- Pattern: `^[0-9]{10}$`

### OTP Code
- Required
- 4-6 digits
- Pattern: `^[0-9]{4,6}$`

### Verification ID
- Required
- UUID format

## Logging

The integration includes comprehensive logging:

```
INFO  - Fetching new authentication token from Message Central
INFO  - Successfully obtained authentication token (expires in 3600 seconds)
INFO  - Sending OTP to mobile number: ******3210
INFO  - OTP sent successfully. Verification ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6
INFO  - Validating OTP for verification ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6 and mobile: ******3210
INFO  - OTP validated successfully for verification ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6
```

## Troubleshooting

### Issue: Authentication fails
**Solution:** Verify your Message Central credentials in environment variables

### Issue: OTP not received
**Solution:** 
- Check mobile number format (10 digits, no country code)
- Verify Message Central account has SMS credits
- Check Message Central dashboard for delivery status

### Issue: Token expired error
**Solution:** Token cache automatically refreshes. If issue persists, check cache configuration

### Issue: Validation fails despite correct OTP
**Solution:** 
- Ensure verification ID matches the one from send-otp response
- OTP typically expires in 2 minutes (120 seconds)
- Mobile number must match exactly

## Production Considerations

1. **Rate Limiting:** Implement rate limiting on OTP endpoints to prevent abuse
2. **HTTPS:** Always use HTTPS in production
3. **Monitoring:** Set up monitoring for OTP success/failure rates
4. **Alerts:** Configure alerts for authentication failures
5. **Audit Logs:** Log all OTP operations for security audit
6. **DDoS Protection:** Use CDN/WAF for DDoS protection
7. **Secret Management:** Use vault services (AWS Secrets Manager, HashiCorp Vault)

## License

This integration is part of the Bus Booking application.
