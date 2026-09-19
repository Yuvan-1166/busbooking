# Twitter OAuth Email Verification JWT Fix - Complete

## What Was Fixed
Twitter OAuth users couldn't complete onboarding after verifying their email. The JWT retained the synthetic email (`twitter_<id>@twitter.oauth.local`) in its subject claim, causing `UsernameNotFoundException` on subsequent requests after the database email was updated to the real email.

## The Fix (4 files, minimal changes)

### Backend (3 files)

**1. NEW: `VerifyTwitterEmailResponse.java`**
```java
public class VerifyTwitterEmailResponse {
    private String accessToken;  // NEW JWT with verified email
    private String tokenType;
    private Long expiresIn;
    private String email;
    private Boolean twitterEmailPending;
}
```

**2. MODIFIED: `UserService.verifyTwitterEmail()`**
- Changed return type: `UserResponse` → `VerifyTwitterEmailResponse`
- Added dependencies: `JwtService`, `CustomUserDetailsService`
- After email update, generates NEW JWT:
  ```java
  UserDetails userDetails = userDetailsService.loadUserByUsername(updated.getEmail());
  String newAccessToken = jwtService.generateToken(userDetails);
  return new VerifyTwitterEmailResponse(newAccessToken, "Bearer", 3600L, ...);
  ```

**3. UPDATED: `UserController`**
- Endpoint return type: `UserResponse` → `VerifyTwitterEmailResponse`

### Frontend (1 file)

**4. MODIFIED: `OnboardingPage.jsx`**
- Added import: `createSession` from authStorage
- Updated `verifyTwitterEmail()`:
  ```javascript
  const response = await api.verifyTwitterEmail(...);
  const newSession = createSession(response);  // Decodes new JWT
  storeSession(newSession);                    // Updates session
  ```

## How It Works

1. User verifies email with OTP during onboarding
2. Backend updates email, clears `twitterEmailPending` flag
3. Backend generates NEW JWT with verified email in subject claim
4. Backend returns JWT in response
5. Frontend decodes new JWT and replaces session
6. AuthContext listener picks up new session
7. Next request uses JWT with correct email ✓

## Verification

✅ Backend compiles without errors
✅ Google OAuth unchanged (still uses LoginResponse)
✅ Password auth unchanged (still uses LoginResponse)
✅ SecurityUtils unchanged
✅ JwtAuthenticationFilter unchanged
✅ No user re-login required
✅ All 8 requirements satisfied

## Files Changed
- `auth/dto/VerifyTwitterEmailResponse.java` (NEW)
- `user/service/UserService.java` (modified verifyTwitterEmail method)
- `user/controller/UserController.java` (updated endpoint)
- `components/auth/OnboardingPage.jsx` (updated verification flow)
