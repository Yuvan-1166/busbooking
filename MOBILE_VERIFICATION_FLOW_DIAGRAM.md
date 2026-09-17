# Mobile Verification - Flow Diagram

## 🔄 Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Profile Page (Overview)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Personal Details Section                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ First Name:  John                                         │  │
│  │ Last Name:   Doe                                          │  │
│  │ Email:       john@example.com                             │  │
│  │ Phone:       9876543210  [Unverified] ← Orange Badge     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Mobile Verification Card                                 │  │
│  │  ───────────────────────────────────────────────────────  │  │
│  │  Verify your mobile number to enhance account security.  │  │
│  │                                                           │  │
│  │  [Verify Mobile Number →]  ← Button                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ User clicks button
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Frontend: sendMobileOtpHandler()                    │
│  • Extract phone number (last 10 digits)                         │
│  • Call api.sendMobileOtp(mobileNumber)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         API: POST /api/verifynow/send-otp                        │
│         Body: { "mobileNumber": "9876543210" }                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Backend: VerifyNowController                        │
│  → VerifyNowOtpService.sendOtp()                                │
│    → MessageCentralAuthService.getAuthToken()                    │
│    → Call MessageCentral API                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         MessageCentral VerifyNow API                             │
│  • Generate OTP                                                  │
│  • Send SMS to +91-9876543210                                    │
│  • Return verificationId                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ SMS sent
                              ↓
         📱 User receives SMS: "Your OTP is 123456"
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Frontend: OTP Form Appears                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ OTP sent successfully to your mobile number.          │  │
│  │                                                           │  │
│  │ Enter OTP:                                                │  │
│  │ [______]  ← 6-digit input                                │  │
│  │                                                           │  │
│  │ [Verify OTP]  [Cancel]                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ User enters OTP and clicks Verify
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Frontend: verifyMobileOtpHandler()                  │
│  • Get verificationId (saved from send response)                 │
│  • Get mobileNumber                                              │
│  • Get code (user input)                                         │
│  • Call api.validateMobileOtp(...)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         API: POST /api/verifynow/validate-otp                    │
│         Body: {                                                  │
│           "verificationId": "uuid-from-send",                    │
│           "mobileNumber": "9876543210",                          │
│           "code": "123456"                                       │
│         }                                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Backend: VerifyNowController                        │
│  → VerifyNowOtpService.validateOtp()                            │
│    → Call MessageCentral Validate API                            │
│    → Check if OTP is valid                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         MessageCentral VerifyNow API                             │
│  • Validate OTP code                                             │
│  • Return validation result                                      │
│    → valid: true/false                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓ If valid = true
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         Frontend: Update Verification Status                     │
│  • Call api.updateMobileVerificationStatus()                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         API: POST /api/v1/users/me/verify-mobile                 │
│         Headers: Authorization: Bearer {token}                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Backend: UserController                             │
│  → UserService.verifyMobile()                                    │
│    → Get current user from SecurityContext                       │
│    → Set user.mobileVerified = true                              │
│    → Set user.mobileVerifiedAt = now()                           │
│    → Save to database                                            │
│    → Return UserResponse                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Database: Update users table                        │
│  UPDATE users                                                    │
│  SET mobile_verified = true,                                     │
│      mobile_verified_at = '2026-09-17 14:00:00'                  │
│  WHERE id = 1;                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Frontend: Success State                             │
│  • setMobileVerified(true)                                       │
│  • Show success message                                          │
│  • Reload user data (getCurrentUser)                             │
│  • Update UI                                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Updated Profile Page                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ First Name:  John                                         │  │
│  │ Last Name:   Doe                                          │  │
│  │ Email:       john@example.com                             │  │
│  │ Phone:       9876543210  [✓ Verified] ← Green Badge      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  (No verification card - already verified)                       │
└─────────────────────────────────────────────────────────────────┘

✅ VERIFICATION COMPLETE!
```

## 📊 Data Flow Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │
       │ 1. User Action (Click "Verify Mobile Number")
       ↓
┌──────────────────┐
│  ProfilePage.jsx │
│   Component      │
│  • State Mgmt    │
│  • Handlers      │
└────────┬─────────┘
         │
         │ 2. api.sendMobileOtp(phone)
         ↓
┌─────────────────┐
│    api.js       │
│  • HTTP Client  │
│  • Auth Headers │
└────────┬────────┘
         │
         │ 3. POST /api/verifynow/send-otp
         ↓
┌──────────────────────────┐
│  Spring Boot Backend     │
│  • VerifyNowController   │
│  • VerifyNowOtpService   │
│  • AuthService           │
└────────┬─────────────────┘
         │
         │ 4. MessageCentral API Call
         ↓
┌───────────────────┐
│  MessageCentral   │
│   VerifyNow API   │
│  • Generate OTP   │
│  • Send SMS       │
└────────┬──────────┘
         │
         │ 5. SMS Delivery
         ↓
      📱 User's Mobile
         │
         │ 6. User enters OTP
         ↓
┌──────────────────┐
│  ProfilePage.jsx │
└────────┬─────────┘
         │
         │ 7. api.validateMobileOtp(id, phone, code)
         ↓
┌─────────────────┐
│    api.js       │
└────────┬────────┘
         │
         │ 8. POST /api/verifynow/validate-otp
         ↓
┌──────────────────────────┐
│  Spring Boot Backend     │
└────────┬─────────────────┘
         │
         │ 9. Validate with MessageCentral
         ↓
┌───────────────────┐
│  MessageCentral   │
│  Returns: valid=true
└────────┬──────────┘
         │
         │ 10. Validation success
         ↓
┌──────────────────┐
│  ProfilePage.jsx │
└────────┬─────────┘
         │
         │ 11. api.updateMobileVerificationStatus()
         ↓
┌─────────────────┐
│    api.js       │
└────────┬────────┘
         │
         │ 12. POST /api/v1/users/me/verify-mobile
         ↓
┌──────────────────────────┐
│  UserController          │
│  → UserService           │
└────────┬─────────────────┘
         │
         │ 13. Update Database
         ↓
┌──────────────────┐
│  PostgreSQL DB   │
│  users table     │
│  • mobile_verified=true
│  • mobile_verified_at=now()
└────────┬─────────┘
         │
         │ 14. Return UserResponse
         ↓
┌──────────────────┐
│  ProfilePage.jsx │
│  • Update state  │
│  • Show badge    │
│  • Hide card     │
└──────────────────┘
```

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                           │
└─────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   ┌──────────────────────────────────────┐
   │ User must be logged in               │
   │ JWT token in Authorization header    │
   │ @PreAuthorize("isAuthenticated()")   │
   └──────────────────────────────────────┘

2. OTP SECURITY
   ┌──────────────────────────────────────┐
   │ OTP expires in 2 minutes (120s)      │
   │ One-time use only                    │
   │ Generated by MessageCentral          │
   └──────────────────────────────────────┘

3. PHONE NUMBER PRIVACY
   ┌──────────────────────────────────────┐
   │ Masked in logs: ******3210           │
   │ Only last 4 digits visible           │
   │ No plaintext in error messages       │
   └──────────────────────────────────────┘

4. VERIFICATION PERSISTENCE
   ┌──────────────────────────────────────┐
   │ Stored in database (immutable)       │
   │ Timestamp recorded                   │
   │ Cannot be re-verified without change │
   └──────────────────────────────────────┘

5. API SECURITY
   ┌──────────────────────────────────────┐
   │ MessageCentral static auth token     │
   │ Token stored in .env (not in code)   │
   │ HTTPS in production                  │
   └──────────────────────────────────────┘
```

## 🎯 State Management

```
ProfilePage Component State:

┌─────────────────────────────────────┐
│ User Data State                     │
│ • user (object)                     │
│ • mobileVerified (boolean)          │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ OTP Flow State                      │
│ • mobileVerificationId (string)     │
│ • mobileOtp (string)                │
│ • mobileOtpSent (boolean)           │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Loading & Error State               │
│ • mobileOtpLoading (boolean)        │
│ • mobileOtpError (string)           │
│ • mobileOtpSuccess (string)         │
└─────────────────────────────────────┘

State Transitions:

INITIAL
  mobileVerified = false
  mobileOtpSent = false
  ↓ User clicks "Verify Mobile Number"
SENDING_OTP
  mobileOtpLoading = true
  ↓ OTP sent successfully
OTP_SENT
  mobileOtpSent = true
  mobileVerificationId = "uuid"
  ↓ User enters OTP
VERIFYING
  mobileOtpLoading = true
  ↓ OTP valid
VERIFIED
  mobileVerified = true
  mobileOtpSent = false
  user.mobileVerified = true
  user.mobileVerifiedAt = timestamp
```

## 📱 UI States

```
STATE 1: UNVERIFIED (Initial)
┌────────────────────────────────────┐
│ Phone: 9876543210 [Unverified]    │
│                                    │
│ ┌────────────────────────────────┐│
│ │ Verify your mobile number...   ││
│ │ [Verify Mobile Number →]       ││
│ └────────────────────────────────┘│
└────────────────────────────────────┘

STATE 2: SENDING_OTP (Loading)
┌────────────────────────────────────┐
│ Phone: 9876543210 [Unverified]    │
│                                    │
│ ┌────────────────────────────────┐│
│ │ [Sending OTP...] (disabled)    ││
│ └────────────────────────────────┘│
└────────────────────────────────────┘

STATE 3: OTP_SENT (Input Form)
┌────────────────────────────────────┐
│ Phone: 9876543210 [Unverified]    │
│                                    │
│ ┌────────────────────────────────┐│
│ │ ✅ OTP sent successfully        ││
│ │                                 ││
│ │ Enter OTP: [______]             ││
│ │                                 ││
│ │ [Verify OTP]  [Cancel]          ││
│ └────────────────────────────────┘│
└────────────────────────────────────┘

STATE 4: VERIFYING (Loading)
┌────────────────────────────────────┐
│ Phone: 9876543210 [Unverified]    │
│                                    │
│ ┌────────────────────────────────┐│
│ │ Enter OTP: [123456]             ││
│ │ [Verifying...] (disabled)       ││
│ └────────────────────────────────┘│
└────────────────────────────────────┘

STATE 5: VERIFIED (Success)
┌────────────────────────────────────┐
│ Phone: 9876543210 [✓ Verified]    │
│                                    │
│ (No verification card)             │
└────────────────────────────────────┘

STATE 6: ERROR (Retry Available)
┌────────────────────────────────────┐
│ Phone: 9876543210 [Unverified]    │
│                                    │
│ ┌────────────────────────────────┐│
│ │ ❌ Invalid OTP. Try again.      ││
│ │                                 ││
│ │ Enter OTP: [______]             ││
│ │ [Verify OTP]  [Cancel]          ││
│ └────────────────────────────────┘│
└────────────────────────────────────┘
```

---

**Visual Flow Complete** ✅

This diagram shows the complete flow from user action to database persistence, including all API calls, state changes, and UI updates.
