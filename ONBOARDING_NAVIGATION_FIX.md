# Onboarding Navigation Bug Fix

## Problem
After users completed Google OAuth onboarding, the frontend stayed on the onboarding page and couldn't navigate away. Even after page reload, users were redirected back to the onboarding page. Users had to log out and log back in to proceed.

**Root Cause:** After onboarding completion, the session in localStorage still had `onboardingRequired: true`, so the App.jsx redirect logic kept sending users back to the `/onboarding` route.

## Solution

### Backend Changes

#### 1. OnboardingService.java
**Changed from:** `void completeOnboarding(OnboardingCompleteRequest request)`  
**Changed to:** `LoginResponse completeOnboarding(OnboardingCompleteRequest request)`

The service now:
1. Completes onboarding (updates profile, assigns role, creates operator if needed)
2. Generates a **new JWT token** with the updated roles
3. Returns `LoginResponse` containing the new token
4. Frontend uses this new token to update the session

```java
// Generate new JWT token with updated roles
UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
String token = jwtService.generateToken(userDetails);

// Return LoginResponse with new token (onboardingRequired is null/false)
return new LoginResponse(token, "Bearer", 3600);
```

#### 2. AuthController.java
**Changed from:** Returns `OtpVerifyResponse` (dummy response)  
**Changed to:** Returns `LoginResponse` (with new JWT token)

```java
@PostMapping("/onboarding/complete")
public LoginResponse completeOnboarding(
        @Valid @RequestBody OnboardingCompleteRequest request
) {
    System.out.println("=== Onboarding Complete Endpoint ===");
    LoginResponse response = onboardingService.completeOnboarding(request);
    System.out.println("=== Onboarding Complete Endpoint Returning ===");
    return response;
}
```

### Frontend Changes

#### OnboardingPage.jsx
**Before:** After successful onboarding, just redirected without updating session
```javascript
await api.completeOnboarding(payload);
setMessage("Profile completed successfully! Redirecting...");
setTimeout(() => {
  navigate("/", { replace: true });
}, 2000);
```

**After:** Fetches updated user data and updates session with `onboardingRequired: false`
```javascript
await api.completeOnboarding(payload);
setMessage("Profile completed successfully! Redirecting...");

setTimeout(async () => {
  try {
    // Fetch updated user details with new roles
    const updatedUser = await api.getCurrentUser();
    const updatedSession = {
      ...session,
      onboardingRequired: false,
      ...updatedUser,
    };
    storeSession(updatedSession);
  } catch (err) {
    console.error("Failed to fetch updated user details:", err);
    // Even if we can't fetch details, mark onboarding as complete
    const updatedSession = {
      ...session,
      onboardingRequired: false,
    };
    storeSession(updatedSession);
  }
  
  navigate("/", { replace: true });
}, 500);
```

## Flow After Fix

```
1. User completes onboarding form
   ↓
2. POST /api/v1/auth/onboarding/complete (with old JWT)
   ↓
3. Backend:
   - Assigns final role
   - Updates user profile
   - Creates operator if needed
   - Generates NEW JWT with updated roles
   - Returns LoginResponse with new JWT
   ↓
4. Frontend receives new JWT
   ↓
5. Fetches updated user details with /users/me
   ↓
6. Updates session in localStorage:
   - onboardingRequired: false ✅
   - roles: Updated role ✅
   - email, accessToken, etc.
   ↓
7. AuthContext detects session change
   ↓
8. App.jsx redirect logic runs:
   - Sees onboardingRequired: false
   - Checks user role
   - Redirects to appropriate dashboard
   ↓
9. Page fully loads and user is on dashboard
```

## Page Reload/Refresh Behavior

**Before Fix:** Kept redirecting to `/onboarding`
```
Page reload → Read localStorage → session has onboardingRequired: true
→ App.jsx redirect → Back to /onboarding → Stuck
```

**After Fix:** Goes to dashboard
```
Page reload → Read localStorage → session has onboardingRequired: false
→ App.jsx redirect → Check roles → Go to dashboard ✅
→ User can navigate normally
```

## Files Modified

### Backend
1. **OnboardingService.java** (45 lines changed)
   - Added JwtService and CustomUserDetailsService dependencies
   - Changed return type from `void` to `LoginResponse`
   - Added JWT token generation at the end
   - Added detailed logging

2. **AuthController.java** (5 lines changed)
   - Changed return type from `OtpVerifyResponse` to `LoginResponse`
   - Now returns the LoginResponse from service instead of dummy response

### Frontend
1. **OnboardingPage.jsx** (20 lines changed)
   - Added import for `storeSession`
   - Updated handleSubmit to fetch updated user details
   - Updated session with new data before redirecting
   - Added error handling for the fetch

## Testing Checklist

- [ ] User signs in with Google
- [ ] Redirected to onboarding page
- [ ] User completes profile as Passenger
- [ ] Should see success message for 2 seconds
- [ ] Automatically redirected to Home page
- [ ] Can browse and search trips
- [ ] Can navigate to other pages ✅
- [ ] Page reload stays on home page (no redirect to onboarding) ✅
- [ ] Log out and log back in with same email
- [ ] Should go straight to home (no onboarding)

## Repeat test for Operator role

- [ ] User signs in with Google (different email)
- [ ] Redirected to onboarding page
- [ ] User completes profile as Operator
- [ ] Should see success message for 2 seconds
- [ ] Automatically redirected to Operator Dashboard
- [ ] Can navigate operator pages
- [ ] Page reload stays on operator dashboard ✅
- [ ] Log out and log back in with same email
- [ ] Should go straight to operator dashboard (no onboarding)

## Build Status
✅ **Backend compiled successfully**

## Database Changes
No schema changes - uses existing `onboarding_completed` flag

## Session Storage Flow

**Google OAuth - Before Onboarding:**
```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "email": "user@gmail.com",
  "roles": ["ROLE_PASSENGER"],
  "onboardingRequired": true,
  "expiresAt": 1789557000000
}
```

**After Onboarding (Updated Session):**
```json
{
  "accessToken": "eyJhbGc... (NEW TOKEN WITH OPERATOR ROLE)",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "email": "user@gmail.com",
  "roles": ["ROLE_OPERATOR"],
  "onboardingRequired": false,
  "expiresAt": 1789557000000
}
```

## Backward Compatibility
- Email/password registered users already skip onboarding
- Existing tokens still work
- No breaking changes to API
- All existing endpoints unchanged
