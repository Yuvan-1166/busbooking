# Twitter OAuth Email Verification JWT Fix - Implementation Summary

## Problem
When a Twitter OAuth user verified their email during onboarding, the JWT still contained the synthetic email (`twitter_<id>@twitter.oauth.local`) in its subject claim. After email verification, the database was updated but the frontend kept using the old JWT. Subsequent authenticated requests failed with:
```
UsernameNotFoundException: User not found: twitter_<id>@twitter.oauth.local
```

## Root Cause
The JWT's `sub` claim contains the email address used for authentication. When the email changed but the JWT wasn't regenerated, `SecurityUtils.getCurrentUserEmail()` extracted the old email from the JWT, causing user lookup to fail.

## Solution Overview
Generate a NEW JWT immediately after email verification with the verified email in the subject claim, return it to the frontend, and replace the session.

---

## Implementation Details

### Backend Changes

#### 1. New DTO: `VerifyTwitterEmailResponse.java`
**Location**: `auth/dto/VerifyTwitterEmailResponse.java`

Contains:
- `accessToken` (NEW JWT with verified email in subject)
- `tokenType` ("Bearer")
- `expiresIn` (3600L)
- `email` (verified email)
- `twitterEmailPending` (false after verification)

```java
public class VerifyTwitterEmailResponse {
    private final String accessToken;
    private final String tokenType;
    private final Long expiresIn;
    private final String email;
    private final Boolean twitterEmailPending;
    // constructor and getters...
}
```

#### 2. Modified: `UserService.verifyTwitterEmail()`
**Location**: `user/service/UserService.java`

Changes:
- Added constructor parameters: `JwtService`, `CustomUserDetailsService`
- Modified method signature: returns `VerifyTwitterEmailResponse` instead of `UserResponse`
- After updating email and clearing flag:
  ```java
  // Generate NEW JWT with the updated email in the subject claim
  UserDetails userDetails = userDetailsService.loadUserByUsername(updated.getEmail());
  String newAccessToken = jwtService.generateToken(userDetails);
  
  return new VerifyTwitterEmailResponse(
      newAccessToken,
      "Bearer",
      3600L,
      updated.getEmail(),
      updated.getTwitterEmailPending()
  );
  ```

#### 3. Updated: `UserController` endpoint
**Location**: `user/controller/UserController.java`

- Updated return type from `ResponseEntity<UserResponse>` to `ResponseEntity<VerifyTwitterEmailResponse>`
- Updated Javadoc to reflect new JWT in response

### Frontend Changes

#### 1. Modified: `OnboardingPage.jsx`
**Location**: `components/auth/OnboardingPage.jsx`

Changes:
- Added `createSession` to imports:
  ```javascript
  import { createSession, storeSession } from "../../auth/authStorage";
  ```

- Updated `verifyTwitterEmail()` function:
  ```javascript
  const verifyTwitterEmail = async (e) => {
    // ...
    const response = await api.verifyTwitterEmail(twitterEmailForm.email, twitterEmailForm.otp);
    
    // Replace session with new JWT that has the verified email in the subject claim
    const newSession = createSession(response);
    storeSession(newSession);
    // ...
  };
  ```

### What Happens (Request/Response Flow)

```
1. Frontend: POST /api/v1/users/me/verify-twitter-email
   - Header: Authorization: Bearer <old JWT with synthetic email>
   - Body: { email: "user@example.com", otp: "123456" }

2. Backend SecurityUtils.getCurrentUserEmail() extracts old synthetic email from JWT
   - Finds user by old email ✓

3. UserService.verifyTwitterEmail():
   - Verifies OTP ✓
   - Checks new email not already registered ✓
   - Updates user.email = "user@example.com"
   - Sets user.twitterEmailPending = false
   - Saves to database ✓
   - Loads UserDetails by NEW email
   - Generates NEW JWT with sub = "user@example.com"
   - Returns VerifyTwitterEmailResponse with new JWT

4. Frontend receives:
   {
     "accessToken": "<NEW JWT with sub=user@example.com>",
     "tokenType": "Bearer",
     "expiresIn": 3600,
     "email": "user@example.com",
     "twitterEmailPending": false
   }

5. Frontend:
   - Calls createSession(response)
     - Decodes JWT: claims.sub = "user@example.com"
     - Returns { accessToken, email: "user@example.com", ... }
   - Calls storeSession(newSession)
     - Stores to localStorage
     - Dispatches 'auth:session-stored' event
   - AuthContext listener picks up new session
   - state.email now = "user@example.com"

6. Next API request:
   - Header: Authorization: Bearer <NEW JWT with sub=user@example.com>
   - Backend extracts email = "user@example.com" ✓
   - User lookup succeeds ✓
```

---

## Verification

✓ Backend compiles without errors
✓ LoginResponse used by Google OAuth (unchanged)
✓ LoginResponse used by password auth (unchanged)
✓ LoginResponse used by Twitter OAuth callback (unchanged)
✓ Only Twitter email verification endpoint changed (new DTO)
✓ No modifications to SecurityUtils
✓ No modifications to JwtAuthenticationFilter
✓ No modifications to AuthContext
✓ Frontend session replacement is atomic
✓ No user re-login required
✓ Existing Google/password auth flows unaffected

---

## Key Design Decisions

1. **Why create a new DTO instead of reusing LoginResponse?**
   - LoginResponse is used across OAuth flows and regular login
   - Keeps concerns separate
   - VerifyTwitterEmailResponse clearly communicates the JWT replacement intent
   - Less risk of side effects

2. **Why not modify the JWT filter?**
   - The instruction explicitly said not to modify SecurityUtils or the filter
   - The new JWT naturally works with existing filter logic
   - Changing the filter would affect all authentication

3. **Why frontend session replacement and not silently use cookie?**
   - JWTs are stored in localStorage, not cookies
   - Frontend must explicitly update localStorage
   - Event listener pattern allows AuthContext to react to change
   - No hidden/implicit behavior

4. **Why generate JWT in UserService instead of controller?**
   - Keeps business logic in service layer
   - Single responsibility: service handles email verification + token generation
   - Controller just returns the response

---

## Minimal Changes Principle

The fix adheres to the requirement of being "simplest correct solution":
- Only 3 backend files modified (1 new, 2 updated)
- Only 1 frontend file modified
- No refactoring of existing code
- No breaking changes
- No modifications to security layer
- Direct fix to the specific problem
