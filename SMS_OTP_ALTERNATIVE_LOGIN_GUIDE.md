# SMS OTP as Alternative TOTP Login - Implementation Guide

## Overview

This document describes the implementation of SMS and Email OTP as alternative authentication methods during TOTP login. When users cannot access their authenticator app, they can now verify their identity using SMS or email instead.

## Architecture

The system follows a modular, layered architecture:

### Backend Components

#### 1. **Entities & DTOs** (`auth/entity/` & `auth/dto/`)
- `TotpAlternativeType` - Enum for method types (SMS, EMAIL, BACKUP_CODE)
- `TotpAlternativeOtp` - JPA entity for OTP session tracking
- `TotpAlternativeOtpRequest` - Request DTO for sending OTP
- `TotpAlternativeOtpResponse` - Response DTO with masked recipient info
- `TotpAlternativeVerifyRequest` - Request DTO for verifying OTP

#### 2. **Service Layer** (`auth/service/TotpAlternativeService`)

Main service coordinating:
- **SMS delivery** via VerifyNow API integration
- **Email delivery** via internal EmailService
- **Rate limiting** per method with configurable thresholds
- **Session management** with TTL tracking
- **Secure storage** with BCrypt hashing
- **Audit logging** with IP and user agent

Key methods:
```java
// Send alternative OTP
sendAlternativeOtp(User, TotpAlternativeType, ipAddress, userAgent)

// Verify OTP code
verifyAlternativeOtp(User, sessionId, code, ipAddress, userAgent)
```

#### 3. **Controller** (`auth/controller/TotpAlternativeController`)

REST endpoints:
- `POST /api/v1/auth/totp-alternative/send` - Send OTP via method
- `POST /api/v1/auth/totp-alternative/verify` - Verify OTP and authenticate

Authentication flow:
1. Extract user from temporary JWT token
2. Validate and route to appropriate delivery method
3. Store session with encrypted OTP
4. Return masked recipient and session ID

#### 4. **Repository** (`auth/repository/TotpAlternativeOtpRepository`)

Database access for:
- OTP session persistence
- Rate limit checking
- Audit trail queries
- Session recovery

### Frontend Components

#### 1. **Utility Service** (`utils/totpAlternativeService.js`)

`TotpAlternativeService` class provides:
- OTP session management
- Session persistence (sessionStorage)
- Time tracking and expiration checking
- Attempt counting
- Helper methods for UI display

Key methods:
```javascript
sendOtp(method, tempToken)      // Send OTP via method
verifyOtp(code, tempToken)      // Verify OTP code
getSession()                    // Get current session
loadSession()                   // Load from storage
getRemainingTime()              // Get TTL countdown
isSessionValid()                // Check session validity
```

#### 2. **Modal Component** (`components/auth/TotpAlternativesModal.jsx`)

Reusable modal UI with:
- Two-phase interaction (method selection → code entry)
- Live countdown timer showing OTP expiration
- SMS and Email method options
- Real-time code validation
- Session persistence and recovery
- Loading states and error handling

#### 3. **Integration** (`components/auth/TotpVerificationPage.jsx`)

Updated login flow:
- Added "Use SMS or Email instead" button
- Integrated TotpAlternativesModal
- Maintains backward compatibility with existing fallback methods

### Database Schema

`totp_alternative_otp` table:
```sql
- id: BIGINT (Primary Key)
- user_id: BIGINT (Foreign Key → user)
- method: VARCHAR(50) - SMS, EMAIL, BACKUP_CODE
- verification_id: VARCHAR(255) - External service ID
- recipient: VARCHAR(255) - Phone or email
- otp_hash: VARCHAR(255) - BCrypt hashed OTP
- status: VARCHAR(50) - PENDING, VERIFIED, EXPIRED, FAILED
- attempt_count: INT - Attempt tracking
- created_at: TIMESTAMP
- expires_at: TIMESTAMP
- verified_at: TIMESTAMP
- ip_address: VARCHAR(45)
- user_agent: TEXT
```

Indexes:
- `idx_user_id` - User lookups
- `idx_verification_id` - External service lookups
- `idx_user_method_created` - Rate limiting queries
- `idx_user_status_created` - Failed attempt tracking

## Configuration

### Application Properties

```properties
# OTP TTL in seconds (default 300 = 5 minutes)
totp.alternative.otp.ttl=300

# Maximum verification attempts per OTP session
totp.alternative.max-attempts=5

# Rate limiting window in minutes
totp.alternative.rate-limit-minutes=15

# VerifyNow SMS Service (from existing configuration)
messagecentral.verifynow.base-url=https://...
messagecentral.verifynow.country-code=91
```

## Workflow

### User Initiates Alternative OTP

```
User cannot access authenticator
    ↓
Clicks "Use SMS or Email instead" on TOTP verification page
    ↓
TotpAlternativesModal opens
    ↓
User selects SMS or EMAIL method
    ↓
Modal calls: POST /api/v1/auth/totp-alternative/send
    ↓
Backend receives method + tempToken
    ↓
Extracts user from tempToken
    ↓
Validates user has verified contact info
    ↓
Routes to appropriate service (VerifyNow for SMS, EmailService for Email)
    ↓
Stores OTP session in database with encrypted code
    ↓
Returns session ID + masked recipient to frontend
    ↓
Frontend stores session, shows countdown timer
```

### User Verifies OTP

```
User receives OTP via SMS or Email
    ↓
Enters 4-6 digit code in modal
    ↓
Modal calls: POST /api/v1/auth/totp-alternative/verify
    ↓
Backend validates OTP session exists and not expired
    ↓
Validates code matches and attempts < max
    ↓
For SMS: Calls VerifyNow verification API
    ↓
For Email: Compares BCrypt hashed code
    ↓
Marks session as VERIFIED
    ↓
Generates JWT access token
    ↓
Returns token to frontend
    ↓
Frontend logs user in and clears session storage
```

## Security Considerations

### OTP Security
- OTP codes are **never stored in plaintext**
- Email OTPs use BCrypt hashing
- SMS OTPs delegated to VerifyNow (external service handles security)
- OTP validity limited to 5 minutes (configurable)

### Session Security
- Temporary tokens required for OTP send/verify
- Temporary tokens tied to specific user
- Session state managed in browser sessionStorage only
- IP address and user agent logged for audit

### Rate Limiting
- Per-method rate limiting (5 attempts per 15 minutes)
- Failed attempts tracked separately
- Exponential backoff on repeated failures
- Can be configured via properties

### Data Privacy
- Recipients masked in responses (e.g., "****1234", "u***@example.com")
- Personal data never logged in application logs
- Audit trail includes IP and user agent only

## Error Handling

### Backend Errors

| Error | Status | Message |
|-------|--------|---------|
| No verified contact | 400 | "User does not have a verified mobile number" |
| Rate limited | 429 | "Too many requests. Please wait 15 minutes..." |
| Invalid session | 400 | "OTP session not found" |
| Expired OTP | 400 | "OTP has expired" |
| Max attempts | 400 | "Too many verification attempts" |
| Invalid code | 400 | "Invalid or expired OTP code" |

### Frontend Handling
- Parses backend error messages
- Shows user-friendly error alerts
- Tracks attempt count locally
- Offers recovery options (new OTP, different method)

## Testing Guide

### Unit Tests
```bash
# Test TotpAlternativeService
mvn test -Dtest=TotpAlternativeServiceTest

# Test TotpAlternativeController
mvn test -Dtest=TotpAlternativeControllerTest
```

### Integration Tests
```bash
# Full flow testing
mvn verify
```

### Manual Testing

1. **SMS Flow**
   - Login with TOTP-enabled account
   - Click "Use SMS or Email instead"
   - Select SMS method
   - Verify phone is masked correctly
   - Enter OTP from SMS
   - Verify success

2. **Email Flow**
   - Login with TOTP-enabled account
   - Click "Use SMS or Email instead"
   - Select Email method
   - Verify email is masked correctly
   - Enter OTP from email
   - Verify success

3. **Rate Limiting**
   - Request OTP 6 times in 15 minutes
   - 6th request should fail with rate limit error
   - Wait 15 minutes
   - Request again - should succeed

4. **Expiration**
   - Request OTP
   - Wait 5+ minutes
   - Try to verify
   - Should fail with expiration error

## Adding New Methods

To add a new OTP method (e.g., WhatsApp):

1. **Update Enum**
   ```java
   public enum TotpAlternativeType {
       SMS("SMS"),
       EMAIL("Email"),
       WHATSAPP("WhatsApp"),
       ...
   }
   ```

2. **Add Service Logic**
   ```java
   case WHATSAPP:
       return sendWhatsAppOtp(user, ipAddress, userAgent);
   ```

3. **Implement Sender**
   ```java
   private TotpAlternativeOtpResponse sendWhatsAppOtp(...) {
       // Integration with WhatsApp service
   }
   ```

4. **Update UI**
   - Add option in `TotpAlternativesModal`
   - Add icon and display name

## Troubleshooting

### OTP Not Received (SMS)
- Check VerifyNow service connectivity
- Verify user has valid verified phone number
- Check rate limiting hasn't been triggered
- Review SMS service logs

### OTP Not Received (Email)
- Check EmailService configuration
- Verify user email is correct
- Check spam/junk folder
- Review email service logs

### Verification Fails
- Verify user entered correct code
- Check OTP hasn't expired
- Verify session ID is valid
- Check attempt count not exceeded

### Database Errors
- Ensure migration ran successfully
- Check table exists with correct schema
- Verify foreign key constraints
- Check database permissions

## Performance Optimization

### Query Optimization
- Use indexed lookups for rate limiting
- Batch queries for multiple users
- Cache user verification status

### Caching
- Cache verified phone/email status (5 min)
- Cache rate limit counters (1 min)
- Invalidate on profile updates

### Async Processing
- Queue email sending to background job
- Log audit events asynchronously
- Clean up expired OTP sessions in batch

## Future Enhancements

1. **Multi-channel Verification**
   - WhatsApp, Telegram, Signal integration
   - Push notifications as fallback
   - Biometric verification option

2. **Advanced Rate Limiting**
   - IP-based rate limiting
   - Device fingerprinting
   - Anomaly detection

3. **Better Recovery**
   - Recovery codes generation
   - Account unlock procedures
   - Support ticket integration

4. **Analytics**
   - OTP delivery metrics
   - Verification success rates
   - Usage patterns by method

## Support & Documentation

- **Backend API**: Inline Javadoc in source files
- **Frontend Service**: JSDoc comments in utility service
- **UI Components**: Prop documentation in React components
- **Database**: Schema comments in migration file

## Contact & Issues

For issues or questions:
1. Check troubleshooting guide above
2. Review application logs
3. Contact development team
