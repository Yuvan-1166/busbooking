# Google OAuth Complete Flow - Fix Summary & Testing Guide

## Issues Fixed

### 1. Missing @PostMapping Annotation ✅
**File:** `AuthController.java` (Line 133)
- **Problem:** The `googleOAuth()` method lacked the `@PostMapping("/google")` annotation
- **Impact:** Spring couldn't route POST requests to `/api/v1/auth/google`, resulting in 403 Forbidden
- **Solution:** Added `@PostMapping("/google")` annotation

```java
@PostMapping("/google")  // ← ADDED
public LoginResponse googleOAuth(
        @Valid @RequestBody GoogleOAuthRequest request
)
```

### 2. Incorrect Security Configuration ✅
**File:** `SecurityConfig.java` (Lines 56-70)
- **Problem:** All `/api/v1/auth/**` endpoints were set to `permitAll()`, including the onboarding endpoint which requires authentication
- **Impact:** Both public endpoints (login, register) and protected endpoints (onboarding) were treated the same
- **Solution:** Split auth endpoints into two categories:
  - **Public:** `/auth/google`, `/auth/login`, `/auth/register`, etc.
  - **Authenticated:** `/auth/onboarding/complete`

```java
// Public auth endpoints (no authentication required)
.requestMatchers(
    "/api/v1/auth/register",
    "/api/v1/auth/operator/register",
    "/api/v1/auth/login",
    "/api/v1/auth/verify/send",
    "/api/v1/auth/verify/confirm",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/google"
).permitAll()

// Authenticated endpoints (requires valid JWT)
.requestMatchers(
    "/api/v1/auth/onboarding/complete"
).authenticated()
```

## Registration Flows

### Email/Password Registration (No Onboarding)
```
1. User submits email, password, firstName, lastName, phone
   ↓
2. POST /api/v1/auth/register
   ↓
3. Backend creates user with status=PENDING_VERIFICATION, onboarding_completed=false
   ↓
4. Wallet created with default balance
   ↓
5. PASSENGER role assigned
   ↓
6. OTP sent to email
   ↓
7. User verifies OTP at POST /api/v1/auth/verify/confirm
   ↓
8. User status → ACTIVE, onboarding_completed → TRUE ✅
   ↓
9. User can login directly → goes to dashboard (no onboarding)
```

### Operator Email/Password Registration (No Onboarding)
```
1. User submits email, password, firstName, lastName, phone, operatorName, registrationNumber, contactPhone
   ↓
2. POST /api/v1/auth/operator/register
   ↓
3. Backend creates user with status=PENDING_VERIFICATION, onboarding_completed=false
   ↓
4. Operator profile created with provided details
   ↓
5. OPERATOR role assigned
   ↓
6. OTP sent to email
   ↓
7. User verifies OTP at POST /api/v1/auth/verify/confirm
   ↓
8. User status → ACTIVE, onboarding_completed → TRUE ✅
   ↓
9. User can login directly → goes to operator dashboard (no onboarding)
```

### Google OAuth Registration (Requires Onboarding)
```
1. User clicks "Sign in with Google"
   ↓
2. User authenticates with Google
   ↓
3. POST /api/v1/auth/google with idToken
   ↓
4. Backend verifies token and creates user with status=ACTIVE, onboarding_completed=FALSE
   ↓
5. PASSENGER role assigned (temporary, for JWT generation)
   ↓
6. Returns JWT with onboardingRequired=true ✅
   ↓
7. Frontend redirects to /onboarding
   ↓
8. User completes profile and selects PASSENGER or OPERATOR role
   ↓
9. POST /api/v1/auth/onboarding/complete with JWT
   ↓
10. Backend updates user role and sets onboarding_completed=true
    ↓
11. Frontend redirects to dashboard
```

## Complete OAuth Flow

### Step 1: User Clicks "Sign in with Google"
```
Frontend → Google OAuth Library
↓
User authenticates with Google
↓
Frontend receives ID token
```

### Step 2: Send Token to Backend
```
POST /api/v1/auth/google
Content-Type: application/json
{
  "idToken": "eyJ...",
  "userType": "PASSENGER"
}
```

### Step 3: Backend Verifies Token & Creates User
**GoogleOAuthService.authenticateWithGoogle()**
- Verifies Google ID token using Google API client
- Extracts email, name, picture from token
- **New User:** Creates new user with PASSENGER role (temporary)
- **Existing User:** Returns existing user
- Saves Google credentials for future logins
- Returns JWT token with `onboardingRequired=true` flag

### Step 4: Frontend Receives JWT & Redirects
```json
{
  "accessToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "onboardingRequired": true
}
```

Frontend:
1. Stores session in localStorage with `onboardingRequired: true`
2. App.jsx detects flag and redirects to `/onboarding`

### Step 5: User Completes Onboarding
```
OnboardingPage.jsx
├─ Select Role: PASSENGER or OPERATOR
├─ Fill Profile: firstName, lastName, phone
└─ If OPERATOR:
   ├─ operatorName
   ├─ registrationNumber
   └─ contactPhone
```

**Request:**
```
POST /api/v1/auth/onboarding/complete
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "role": "OPERATOR",
  "firstName": "Yuvan Shankar",
  "lastName": "S",
  "phone": "7708699796",
  "operatorName": "Yuvan's Tourists",
  "registrationNumber": "HJ789876VG87YH",
  "contactPhone": "7708699796"
}
```

### Step 6: Backend Completes Onboarding
**OnboardingService.completeOnboarding()**
1. Gets current user from JWT token via SecurityUtils
2. Updates user profile (firstName, lastName, phone)
3. **If PASSENGER:** Creates wallet
4. **If OPERATOR:** Creates operator profile with details
5. Removes temporary PASSENGER role
6. Assigns final role (PASSENGER or OPERATOR)
7. Sets `onboardingCompleted = true`

### Step 7: User Redirected to Dashboard
```
App.jsx detects onboardingRequired=false
├─ PASSENGER → HomePage (search & book)
├─ OPERATOR → OperatorDashboard
└─ ADMIN → AdminDashboard
```

## Testing Checklist

### Prerequisites
- [ ] Backend running on `localhost:8080`
- [ ] Frontend running on `localhost:5173`
- [ ] Google OAuth credentials configured in `application.properties`
- [ ] Database seeded with roles (PASSENGER, OPERATOR, ADMIN)

### Test Steps

#### 1. Google Sign-In
- [ ] Navigate to `http://localhost:5173/login`
- [ ] Click "Sign in with Google"
- [ ] Authenticate with Google account
- [ ] Backend should return JWT with `onboardingRequired: true`
- [ ] Frontend should redirect to `/onboarding`

#### 2. Complete as Passenger
- [ ] Select "🧑‍💼 Passenger" role
- [ ] Fill in: First Name, Last Name, Phone
- [ ] Click "Complete Profile"
- [ ] Should redirect to home page
- [ ] Should show search interface

#### 3. Complete as Operator
- [ ] Return to login and repeat Step 1 with different email
- [ ] Select "🚌 Operator" role
- [ ] Fill in all fields:
  - First Name, Last Name, Phone
  - Business Name, Registration Number, Contact Phone
- [ ] Click "Complete Profile"
- [ ] Should redirect to operator dashboard

#### 4. Subsequent Logins
- [ ] Log out from `/profile`
- [ ] Click "Sign in with Google" again with same email
- [ ] Should go directly to dashboard (no onboarding)
- [ ] `onboardingRequired` should be `false`

## Files Modified

### Backend
1. **AuthController.java**
   - Added `@PostMapping("/google")` annotation to `googleOAuth()` method

2. **SecurityConfig.java**
   - Separated public and authenticated auth endpoints
   - Moved `/auth/onboarding/complete` from `permitAll()` to `authenticated()`

### Frontend (Already Correct)
- ✅ **AuthPage.jsx** - Sends token to `/auth/google`
- ✅ **OnboardingPage.jsx** - Sends profile to `/auth/onboarding/complete`
- ✅ **authStorage.js** - Stores `onboardingRequired` flag
- ✅ **App.jsx** - Redirects based on `onboardingRequired` flag
- ✅ **api.js** - Includes Bearer token in requests

## Troubleshooting

### 403 Error on `/auth/google`
**Cause:** Missing `@PostMapping` annotation
**Fix:** Already applied in AuthController.java

### 403 Error on `/auth/onboarding/complete`
**Causes:**
1. Missing/invalid JWT token
2. Token not included in Authorization header
3. Token expired

**Fix:** 
- Ensure valid token from Google OAuth
- Check Authorization header includes `Bearer <token>`
- Verify token hasn't expired

### Infinite Redirect Loop
**Cause:** Session not properly stored after Google OAuth
**Fix:** Check browser localStorage for `busbooking.auth`

### User Created Without Role
**Cause:** OnboardingService error or not called
**Fix:** Check backend logs for errors in `OnboardingService.completeOnboarding()`

## Database State Changes by Authentication Method

### Email/Password Registration - After OTP Verification ✅
```sql
-- User created with email/password
INSERT INTO users (email, password_hash, first_name, status, onboarding_completed) 
VALUES ('user@email.com', '$2a$10$...', 'John', 'ACTIVE', true);

-- PASSENGER role assigned
INSERT INTO user_roles (user_id, role_id) 
VALUES (<user_id>, <passenger_role_id>);

-- Wallet created
INSERT INTO user_wallets (user_id, balance) 
VALUES (<user_id>, 10000);
```

### Operator Email/Password Registration - After OTP Verification ✅
```sql
-- User created with email/password
INSERT INTO users (email, password_hash, first_name, status, onboarding_completed) 
VALUES ('operator@email.com', '$2a$10$...', 'Jane', 'ACTIVE', true);

-- Operator profile created immediately
INSERT INTO operators (user_id, name, registration_number, contact_phone, status) 
VALUES (<user_id>, 'Bus Company', 'REG123', '9876543210', 'ACTIVE');

-- OPERATOR role assigned
INSERT INTO user_roles (user_id, role_id) 
VALUES (<user_id>, <operator_role_id>);
```

### Google OAuth Registration - After Sign-In (Requires Onboarding) ⏳
```sql
-- New user created (Google auth)
INSERT INTO users (email, first_name, status, onboarding_completed) 
VALUES ('user@gmail.com', 'User', 'ACTIVE', false);

-- Google credentials saved
INSERT INTO user_google_credentials (google_sub, google_email, display_name, picture_url, user_id) 
VALUES ('1234567890', 'user@gmail.com', 'User Name', 'https://...', <user_id>);

-- Temporary PASSENGER role assigned (for JWT generation)
INSERT INTO user_roles (user_id, role_id) 
VALUES (<user_id>, <passenger_role_id>);
```

### Google OAuth - After Completing Onboarding (Passenger) ✅
```sql
-- User profile updated
UPDATE users SET 
  first_name = 'John',
  last_name = 'Doe',
  phone = '9876543210',
  onboarding_completed = true
WHERE id = <user_id>;

-- Wallet created
INSERT INTO user_wallets (user_id, balance) 
VALUES (<user_id>, 10000);

-- PASSENGER role already exists, so no change
```

### Google OAuth - After Completing Onboarding (Operator) ✅
```sql
-- User profile updated
UPDATE users SET 
  first_name = 'Jane',
  last_name = 'Smith',
  phone = '9876543210',
  onboarding_completed = true
WHERE id = <user_id>;

-- Temporary PASSENGER role removed
DELETE FROM user_roles WHERE user_id = <user_id> AND role_id = <passenger_role_id>;

-- OPERATOR role assigned
INSERT INTO user_roles (user_id, role_id) 
VALUES (<user_id>, <operator_role_id>);

-- Operator profile created
INSERT INTO operators (user_id, name, registration_number, contact_phone, status) 
VALUES (<user_id>, 'Business Name', 'REG123', '9876543210', 'ACTIVE');
```

## Database State Changes by Authentication Method

## Build Status
- ✅ Compiled successfully (Maven)
- ✅ No compilation errors
- ✅ Ready to test

## Next Steps

1. **Restart Backend**
   ```bash
   cd busbooking
   .\mvnw.cmd spring-boot:run
   ```

2. **Test Flow**
   - Follow "Testing Checklist" above

3. **Deploy**
   - Once tested, build JAR and deploy to production
