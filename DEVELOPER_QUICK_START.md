# SMS OTP Alternative Login - Developer Quick Start

Get the SMS OTP alternative login feature running in minutes.

## What Is This?

Users with TOTP enabled (2FA via authenticator app) can now fall back to SMS or Email OTP when they lose access to their authenticator app. This is a **safe, modular addition** to the existing TOTP system.

## Key Files Overview

### Backend (Java/Spring Boot)

**Service Layer** (`TotpAlternativeService`)
```
Coordinates SMS/Email delivery
├── Send OTP: sendAlternativeOtp(user, method)
├── Verify OTP: verifyAlternativeOtp(user, sessionId, code)
└── Rate limiting: Prevent brute force
```

**Controller** (`TotpAlternativeController`)
```
REST API endpoints
├── POST /auth/totp-alternative/send   → Send OTP
└── POST /auth/totp-alternative/verify → Verify & authenticate
```

**Entity** (`TotpAlternativeOtp`)
```
Database persistence for OTP sessions
├── Stores encrypted OTP codes
├── Tracks attempts and rate limiting
└── Audit trail (IP, user agent)
```

### Frontend (React)

**Modal Component** (`TotpAlternativesModal`)
```
User-facing modal for SMS/Email selection
├── Method selection screen
├── OTP code entry with countdown timer
└── Error handling and recovery
```

**Service** (`totpAlternativeService.js`)
```
Client-side session management
├── OTP session lifecycle
├── SessionStorage persistence
└── Helper utilities
```

**Integration** (`TotpVerificationPage`)
```
Updated login verification page
└── Added "Use SMS or Email instead" button
```

## Quick Setup (5 minutes)

### 1. Database
```bash
# Migration runs automatically
# Nothing to do - Flyway handles it
# Creates: totp_alternative_otp table
```

### 2. Backend Configuration
Add to `application.properties` (optional - has defaults):
```properties
totp.alternative.otp.ttl=300
totp.alternative.max-attempts=5
totp.alternative.rate-limit-minutes=15
```

### 3. Build and Run
```bash
# Backend auto-detects new files
mvn clean install
mvn spring-boot:run
```

### 4. Frontend
```bash
# Frontend code included
# Already imported in TotpVerificationPage
npm install
npm run dev
```

Done! ✅

## How It Works (User Perspective)

```
TOTP Login Flow:
1. User logs in with email/password
2. TOTP page asks for authenticator code
3. User clicks "Use SMS or Email instead"
4. Modal appears with method options
5. User selects SMS or Email
6. OTP sent to phone/email
7. User enters 6-digit code
8. Logged in! ✅
```

## Testing It Out

### Test SMS Flow
```
1. Create account with 2FA enabled
2. Login → TOTP verification page
3. Click "Use SMS or Email instead"
4. Select "SMS Code"
5. Enter code from SMS
6. Should login successfully
```

### Test Email Flow
```
Same as above, but select "Email Code"
```

### Test Rate Limiting
```
1. Request OTP 6 times
2. 6th request fails with: "Too many requests"
3. Wait 15 minutes or change IP
4. Request again - should work
```

## Code Examples

### Backend: Send OTP
```java
// TotpAlternativeService.java
OtpAlternativeOtpResponse response = alternativeOtpService.sendAlternativeOtp(
    user,
    TotpAlternativeType.SMS,
    "192.168.1.1",
    "Mozilla/5.0..."
);
// Returns: { sessionId, maskedRecipient, expiresIn }
```

### Backend: Verify OTP
```java
boolean verified = alternativeOtpService.verifyAlternativeOtp(
    user,
    sessionId,
    "123456",
    ipAddress,
    userAgent
);
// Returns: true if valid, false otherwise
```

### Frontend: Using Modal
```jsx
<TotpAlternativesModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onVerified={(token) => {
    login(token);
    navigate('/');
  }}
  tempToken={tempToken}
  user={user}
/>
```

### Frontend: Using Service
```javascript
const service = new TotpAlternativeService(api);

// Send OTP
const session = await service.sendOtp('SMS', tempToken);
console.log(`OTP sent to ${session.maskedRecipient}`);

// Verify OTP
const response = await service.verifyOtp('123456', tempToken);
login(response.accessToken);
```

## Common Tasks

### Add New OTP Method (e.g., WhatsApp)

1. Update enum:
```java
// TotpAlternativeType.java
public enum TotpAlternativeType {
    SMS("SMS"),
    EMAIL("Email"),
    WHATSAPP("WhatsApp"),  // Add this
    BACKUP_CODE("Backup Code");
}
```

2. Add service method:
```java
// TotpAlternativeService.java
private TotpAlternativeOtpResponse sendWhatsAppOtp(...) {
    // Integration logic
}
```

3. Update switch statement:
```java
case WHATSAPP:
    return sendWhatsAppOtp(user, ipAddress, userAgent);
```

4. Update modal:
```jsx
// TotpAlternativesModal.jsx
<button onClick={() => handleMethodSelect('WHATSAPP')}>
  <div className="text-3xl mr-4">💬</div>
  <div>
    <h3>WhatsApp</h3>
    <p>Get code via WhatsApp</p>
  </div>
</button>
```

### Increase Rate Limit

```properties
# application.properties
totp.alternative.rate-limit-minutes=30  # Was 15
totp.alternative.max-attempts=10        # Was 5
```

### Change OTP Validity Time

```properties
# application.properties
totp.alternative.otp.ttl=600  # 10 minutes (was 5)
```

## Debugging

### OTP Not Sending

**SMS not working?**
```
1. Check VerifyNow service status
2. Verify user has verified mobile number
3. Check logs for API errors
4. Review SMS service configuration
```

**Email not working?**
```
1. Check email service configuration
2. Verify SMTP credentials
3. Check logs for SMTP errors
4. Review email template
```

### Verification Failing

```
1. Check if code is correct
2. Verify OTP hasn't expired
3. Check attempt count
4. Review database for OTP record
```

### Rate Limiting Issues

```
1. Check rate_limit_minutes config
2. Verify rate limiting logic
3. Check attempt tracking in DB
4. Review OTP session records
```

## File Structure Reference

```
busbooking/
├── backend/
│   └── src/main/java/com/yuvan/busbooking/auth/
│       ├── entity/
│       │   ├── TotpAlternativeType.java      ← New
│       │   └── TotpAlternativeOtp.java       ← New
│       ├── dto/
│       │   ├── TotpAlternativeOtpRequest.java     ← New
│       │   ├── TotpAlternativeOtpResponse.java    ← New
│       │   └── TotpAlternativeVerifyRequest.java  ← New
│       ├── service/
│       │   └── TotpAlternativeService.java   ← New
│       ├── controller/
│       │   └── TotpAlternativeController.java ← New
│       └── repository/
│           └── TotpAlternativeOtpRepository.java ← New
│
├── frontend/
│   └── src/
│       ├── components/auth/
│       │   ├── TotpAlternativesModal.jsx     ← New
│       │   └── TotpVerificationPage.jsx      ← Updated
│       ├── utils/
│       │   └── totpAlternativeService.js     ← New
│       └── api.js                             ← Updated
│
└── resources/db/migration/
    └── V1__Create_TOTP_Alternative_OTP_Table.sql ← New
```

## Dependencies

No new external dependencies! Uses:
- Spring Boot (existing)
- JPA/Hibernate (existing)
- Spring Security (existing)
- VerifyNow API (existing)
- EmailService (existing)
- React (existing)

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Send SMS OTP | <2s | Includes VerifyNow API |
| Send Email OTP | <1s | Async delivery |
| Verify OTP | <1s | DB query + validation |
| Modal load | Instant | 15KB component |

## Security Checklist

- ✅ OTP never stored in plaintext
- ✅ Rate limiting prevents brute force
- ✅ Session tied to user
- ✅ Audit logging enabled
- ✅ Personal data masked
- ✅ HTTPS enforcement (Spring Security)
- ✅ CORS properly configured

## Troubleshooting Quick Links

- **OTP send fails** → Check VerifyNow/Email service
- **Verification fails** → Check rate limiting
- **Modal not showing** → Check import in TotpVerificationPage
- **Database error** → Run Flyway migrations
- **API 401** → Check temp token validity

## Next Steps

1. **Review** the complete guide: `SMS_OTP_ALTERNATIVE_LOGIN_GUIDE.md`
2. **Test** all flows locally
3. **Deploy** to staging
4. **Load test** if needed
5. **Monitor** in production

## Help & Support

- **Quick Reference**: `SMS_OTP_QUICK_REFERENCE.md`
- **Comprehensive Guide**: `SMS_OTP_ALTERNATIVE_LOGIN_GUIDE.md`
- **Implementation Details**: `SMS_OTP_IMPLEMENTATION_SUMMARY.md`
- **Code Comments**: Inline Javadoc and JSDoc

---

**Questions?** Check the docs above first, then contact the development team.

**Ready to get started?** You now have everything needed! 🚀
