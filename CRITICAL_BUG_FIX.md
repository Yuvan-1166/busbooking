# Critical Bug Fix - Login Flow

## Issue
After completing the auth flow redesign, users were getting a 403 error when trying to login:

```
java.lang.IllegalStateException: Two-factor authentication is required but not configured. Please contact support.
at com.yuvan.busbooking.auth.service.AuthService.login(AuthService.java:202)
```

## Root Cause
The `AuthService.login()` method had logic that **required TOTP for all non-admin users**:

```java
// OLD CODE (WRONG)
if (isAdmin) {
    // Admin users bypass TOTP
    String token = jwtService.generateToken(userDetails);
    return new LoginResponse(token, "Bearer", 3600L);
}

// Non-admin users must have TOTP enabled
if (!user.getTotpEnabled()) {
    throw new IllegalStateException(
        "Two-factor authentication is required but not configured. Please contact support."
    );
}

// Generate temporary token for TOTP verification
String tempToken = jwtService.generateTempToken(userDetails);
return new LoginResponse(true, tempToken, user.getId());
```

This logic assumed:
- Admins don't need TOTP (correct)
- ALL non-admin users must have TOTP enabled (WRONG - this was the old flow)

## Fix
Changed the logic to check if the **user has TOTP enabled**, regardless of role:

```java
// NEW CODE (CORRECT)
if (user.getTotpEnabled()) {
    // User has 2FA enabled - require TOTP verification
    String tempToken = jwtService.generateTempToken(userDetails);
    return new LoginResponse(true, tempToken, user.getId());
}

// User doesn't have 2FA - return full token immediately
String token = jwtService.generateToken(userDetails);
return new LoginResponse(token, "Bearer", 3600L);
```

Now the logic is:
- If user has TOTP enabled → Require TOTP verification
- If user doesn't have TOTP → Login immediately
- Works for all roles (admin, operator, passenger)

## File Changed
- `src/main/java/com/yuvan/busbooking/auth/service/AuthService.java`

## Verification
✅ Backend recompiled successfully (181 files)

## Test Scenario
1. Register new user
2. Verify email with OTP
3. Login with credentials
4. ✅ Should login immediately (no TOTP prompt)
5. Go to Profile → Enable 2FA
6. Logout and login again
7. ✅ Should now require TOTP code

## Status
✅ FIXED - Users can now login without mandatory 2FA
