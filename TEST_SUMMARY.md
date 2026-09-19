# Twitter OAuth Email Verification JWT Fix - Test Scenario

## Problem Solved
The bug occurred because when a Twitter OAuth user verified their email during onboarding, the backend updated the database email but the frontend kept using the old JWT with the synthetic email (twitter_<id>@twitter.oauth.local) in its subject claim. Subsequent API requests failed with `UsernameNotFoundException` because the JWT had the old email.

## Solution Implemented
The fix implements JWT regeneration on email verification:

1. **Backend**:
   - Created `VerifyTwitterEmailResponse` DTO with new JWT
   - Modified `UserService.verifyTwitterEmail()` to:
     - Update user email in database
     - Clear `twitterEmailPending` flag
     - Generate NEW JWT with the verified email in subject claim
     - Return JWT in response
   - Updated `UserController` to return the new response type

2. **Frontend**:
   - `OnboardingPage` captures the response from email verification API
   - Uses `createSession()` to decode the new JWT (which now has the real email in subject)
   - Stores new session with `storeSession()` which triggers auth:session-stored event
   - `AuthContext` listener picks up the new session
   - Subsequent API requests use the new JWT with correct email

## Test Flow

### Test Case 1: Twitter OAuth User Email Verification
**Setup**: User logs in with Twitter, JWT has subject: `twitter_<id>@twitter.oauth.local`

**Steps**:
1. Frontend shows OnboardingPage with email verification form
2. User enters real email (e.g., user@example.com)
3. User receives and enters OTP
4. Frontend calls POST /api/v1/users/me/verify-twitter-email
5. Backend:
   - Finds user by current email (twitter_<id>@twitter.oauth.local)
   - Verifies OTP
   - Updates user.email = "user@example.com"
   - Sets user.twitterEmailPending = false
   - Saves user
   - Generates NEW JWT with subject = "user@example.com"
   - Returns VerifyTwitterEmailResponse with new JWT
6. Frontend:
   - Receives response with new accessToken
   - Calls createSession(response) which decodes new JWT → email is now "user@example.com"
   - Calls storeSession(newSession)
   - AuthContext listener updates session state
7. Verify: Subsequent API requests now use JWT with correct email

**Expected Result**: ✓ User can complete profile, existing Google/password auth works

### Key Points
- JWT subject is used by SecurityUtils.getCurrentUserEmail() for authentication
- JwtService.generateToken() encodes email in subject claim
- Frontend's createSession() decodes JWT and extracts email from claims.sub
- Session replacement is atomic via storeSession() + event listener
- No user re-login required
- Google/password auth flows unchanged (they don't use email verification)

## Files Modified

### Backend
- `VerifyTwitterEmailResponse.java` (NEW)
- `UserService.java` - verifyTwitterEmail() method signature changed
- `UserController.java` - endpoint return type changed

### Frontend
- `OnboardingPage.jsx` - email verification flow updated to handle new JWT

### No Changes Needed
- `SecurityUtils` - remains unchanged, works with new JWT
- `JwtAuthenticationFilter` - remains unchanged, works with new JWT
- Google OAuth flow - unchanged
- Password authentication - unchanged
- AuthContext - already handles response objects correctly
