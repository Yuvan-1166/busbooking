# Logging Quick Reference Guide

## Where Are Logs Stored?

**Directory:** `logs/` (created in the application's working directory at runtime)

**Main Files:**
- `logs/busbooking-all.log` - Everything (primary log file)
- `logs/busbooking-request.log` - HTTP requests/responses only
- `logs/busbooking-error.log` - Errors only
- `logs/archive/` - Historical logs (auto-rotated)

## What Gets Logged?

### 1. Every HTTP Request/Response
- Method, URI, query params
- Headers (sensitive ones masked)
- Request/response body
- Response status & duration
- Client IP address

### 2. Every Service/Controller Method
- Method entry with parameters
- Method exit with return value
- Execution time
- Exception details if error occurs

### 3. Application Events
- Authentication attempts
- Booking operations
- Payment processing
- User management
- Trip operations

## No Console Output

✅ **CONFIRMED** - All logs go to files ONLY  
✅ **No terminal clutter** - Clean development/production terminal  
✅ **All details in files** - Use `tail -f logs/busbooking-request.log` to monitor

## Log Format

```
2026-10-01 08:15:45.123 [http-nio-8080-exec-1] INFO  AuthService - User login attempt
2026-10-01 08:15:45.456 [http-nio-8080-exec-1] DEBUG BookingService - Booking created: ID=12345
2026-10-01 08:15:46.789 [http-nio-8080-exec-2] ERROR PaymentService - Payment failed: timeout
```

Format: `[Timestamp] [Thread] [Level] [Logger] - [Message]`

## Sensitive Data Protection

Automatically masked in logs:
- Passwords
- Authentication tokens
- API secrets
- Card numbers & CVV
- OTP & PIN codes
- Authorization headers

Example:
```
{"email":"user@example.com","password":"***MASKED***"}
```

## Monitoring in Real-Time

### Watch HTTP Requests
```bash
tail -f logs/busbooking-request.log
```

### Watch All Logs
```bash
tail -f logs/busbooking-all.log
```

### Search for Errors
```bash
grep ERROR logs/busbooking-error.log
```

### Find Logs for Specific User/Request
```bash
grep "user@example.com" logs/busbooking-all.log
```

## Environment Profiles

### Development (Debug Level)
```bash
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=dev
# or
java -jar busbooking.jar --spring.profiles.active=dev
```

### Production (Info Level)
```bash
java -jar busbooking.jar --spring.profiles.active=prod
```

## File Rotation

Logs automatically rotate when:
- File reaches 10MB
- Daily at midnight (date-based naming)

Example archive filenames:
- `busbooking-all-2026-10-01.1.log`
- `busbooking-all-2026-10-02.1.log`

Old archives kept for 30 days, then deleted.

## Configuration Files

**Logback Settings:** `src/main/resources/logback-spring.xml`
- File paths
- Rotation policies
- Log levels per package
- Pattern format

**Application Settings:** `src/main/resources/application.properties`
- Console logging: DISABLED
- Logback config: ENABLED

## Adding Logs to New Code

Already available in all classes with `@Slf4j`:
```java
log.info("Information message: {}", variable);
log.warn("Warning message");
log.error("Error message", exception);
log.debug("Debug details");
```

For new classes, add annotation:
```java
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MyService {
    public void doSomething() {
        log.info("Doing something");
    }
}
```

## Performance Impact

- Minimal overhead - logging happens asynchronously
- Request/response body limited to 2000 chars
- Method parameters limited to 500 chars each
- No database calls for logging
- No external service calls

## Troubleshooting

### Logs not appearing?
1. Check `logs/` directory exists
2. Check file permissions on `logs/` directory
3. Verify application is writing to correct directory
4. Check `logs/busbooking-error.log` for logging errors

### Logs too large?
1. Reduce `LOG_FILE_MAX_HISTORY` in logback-spring.xml
2. Reduce `LOG_FILE_MAX_SIZE` for more frequent rotation
3. Enable compression of archived logs

### Need more details?
1. Change profile to `dev` for DEBUG level logging
2. Check method-level logs in `busbooking-app.log`
3. Add custom log statements in relevant service methods

## Built-in Logging Coverage

✅ Authentication & JWT handling  
✅ User registration & login  
✅ Booking creation & management  
✅ Payment processing  
✅ Trip scheduling  
✅ Seat management  
✅ Wallet operations  
✅ TOTP/2FA flow  
✅ OAuth integrations  
✅ Email notifications  
✅ Analytics tracking  
✅ All HTTP requests/responses  

Every critical business operation is logged with details needed for debugging and auditing.
