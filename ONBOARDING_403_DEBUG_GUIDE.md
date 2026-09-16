# Onboarding 403 Error - Debugging Guide

## Issue
POST /api/v1/auth/onboarding/complete returns 403 Forbidden even with valid JWT token

## Root Cause - Unknown
The 403 is being returned before the controller is hit, indicating a Spring Security issue.

## Setup for Debugging

### Step 1: Rebuild Backend
```bash
cd busbooking
.\mvnw.cmd clean compile -DskipTests
```

### Step 2: Start Backend with Console Visible
```bash
.\mvnw.cmd spring-boot:run
```
**Important:** Keep the console window open and visible.

### Step 3: Test Flow
1. Open browser to `http://localhost:5173/login`
2. Click "Sign in with Google"
3. Complete authentication
4. Navigate to onboarding page
5. Fill in all fields
6. Click "Complete Profile"

### Step 4: Examine Console Output
Watch the console for these debug logs in this order:

#### First Request (Google OAuth)
```
=== Google OAuth Flow Started ===
User Type: PASSENGER
Token received: YES (length: XXXX)
Token verification: SUCCESS
Email: user@gmail.com
Name: User Name
Google Sub: 1234567890
=== Google Credential Saved ===
User ID: X
Email: user@gmail.com
Onboarding Completed: false
Temporary PASSENGER role assigned for onboarding
=== JWT Token Generated ===
Token: eyJhbGciOiJIUzI1NiJ9.eyJzdWI...
Onboarding Required: true
```

#### Second Request (Onboarding Complete) - THIS IS WHERE 403 HAPPENS
```
=== JWT Filter Debug ===
Path: /api/v1/auth/onboarding/complete
Method: POST
Auth Header Present: true
Token found: eyJhbGciOiJIUzI1NiJ9...
Token validation result: true
Token is valid, extracting username
Email extracted: user@gmail.com
No existing authentication, loading user details for: user@gmail.com
User loaded successfully
Username: user@gmail.com
Enabled: true
Authorities: [ROLE_PASSENGER]
Authentication set successfully in SecurityContext
IsAuthenticated: true
Proceeding to next filter
```

Or possibly:
```
=== ONBOARDING SERVICE CALLED ===
Timestamp: 1789555139000
Current user email from SecurityUtils: user@gmail.com
User: user@gmail.com
User ID: 123
User Status: ACTIVE
Role: OPERATOR
```

## Possible Causes to Check

### 1. JWT Token Invalid
Look for: `Token validation result: false`
**Solution:** Regenerate token or check JWT secret

### 2. User Not Found
Look for: `ERROR: User not found in database: user@gmail.com`
**Solution:** User wasn't saved after Google OAuth

### 3. User Disabled
Look for: `Enabled: false`
**Solution:** User status is not ACTIVE (check database: SELECT * FROM users WHERE email='...')

### 4. Authorities Empty
Look for: `Authorities: []`
**Solution:** User roles weren't saved (check database: SELECT * FROM user_roles WHERE user_id=...)

### 5. SecurityContext Not Set
Look for: Missing "Authentication set successfully" line
**Solution:** Exception thrown during user loading (check error message in logs)

### 6. Never Reaches Onboarding Service
Look for: No "=== ONBOARDING SERVICE CALLED ===" line
**Solution:** Spring Security is blocking before controller

## SQL Queries to Run (If Needed)

Check if user and role exist after Google OAuth:

```sql
-- Check user was created
SELECT id, email, status, onboarding_completed 
FROM users 
WHERE email = 'your-email@gmail.com';

-- Check user has PASSENGER role
SELECT ur.id, ur.user_id, r.name 
FROM user_roles ur 
JOIN roles r ON ur.role_id = r.id 
WHERE ur.user_id = (SELECT id FROM users WHERE email = 'your-email@gmail.com');

-- Check google credentials
SELECT id, google_sub, google_email, user_id 
FROM user_google_credentials 
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@gmail.com');
```

## Common Issues & Solutions

| Issue | Log Evidence | Fix |
|-------|--------------|-----|
| Token expired | `Token validation result: false` | Clear browser storage and re-login |
| User not saved | `ERROR: User not found in database` | Check GoogleOAuthService transaction |
| Role not saved | `Authorities: []` | Check if PASSENGER role exists in database |
| User disabled | `Enabled: false` | Verify user status is ACTIVE in database |
| Exception in filter | `ERROR loading user details` | See exception message in logs |

## Files with Debug Logging

1. **JwtAuthenticationFilter.java** - Logs every filter call
2. **OnboardingService.java** - Logs onboarding start and steps
3. **GoogleOAuthService.java** - Already has logs for OAuth flow

## Next Steps After Collecting Logs

1. Copy complete console output
2. Share with developer
3. Developer will identify exact cause
4. Provide targeted fix

## Quick Checklist

- [ ] Rebuilt backend after code changes
- [ ] Restarted backend (not just code reload)
- [ ] Console window is open and visible
- [ ] Cleared browser cache/localStorage
- [ ] Tested complete flow end-to-end
- [ ] Collected full console output
- [ ] Checked all log lines appear in expected order
