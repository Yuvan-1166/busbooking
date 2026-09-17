# Mobile Verification Test Guide

## Overview
Complete mobile verification feature using MessageCentral SMS OTP flow integrated into the Profile Page.

## Implementation Summary

### Backend Changes

1. **User Entity** (`User.java`)
   - Added `mobileVerified` (Boolean) field
   - Added `mobileVerifiedAt` (LocalDateTime) field
   - Fields initialize to `false` and `null` respectively on user creation

2. **UserResponse DTO** (`UserResponse.java`)
   - Added `totpEnabled` field
   - Added `mobileVerified` field  
   - Added `mobileVerifiedAt` field

3. **UserService** (`UserService.java`)
   - Updated `toResponse()` method to map new fields
   - Added `verifyMobile(Long userId)` method
   - Added `verifyMobile()` method for current authenticated user

4. **UserController** (`UserController.java`)
   - Added `POST /api/v1/users/me/verify-mobile` endpoint
   - Requires authentication (`@PreAuthorize("isAuthenticated()")`)
   - Returns updated UserResponse with verification status

### Frontend Changes

1. **API Helper** (`frontend/src/api.js`)
   - `sendMobileOtp(mobileNumber)` - Sends OTP via MessageCentral
   - `validateMobileOtp(verificationId, mobileNumber, code)` - Validates OTP
   - `updateMobileVerificationStatus()` - Marks user as verified in backend

2. **ProfilePage** (`frontend/src/components/profile/ProfilePage.jsx`)
   - Added verification status badge next to phone number in Personal Details
   - Added mobile verification card when phone is unverified
   - Integrated two-step OTP flow:
     1. Send OTP button
     2. Enter OTP form with Verify/Cancel buttons
   - Auto-reloads user data after successful verification
   - Clean error and success message handling

## Testing Steps

### Prerequisites

1. **Backend Running**
   ```bash
   cd busbooking
   .\mvnw.cmd spring-boot:run
   ```

2. **Frontend Running**
   ```bash
   cd frontend
   npm run dev
   ```

3. **MessageCentral Configured**
   - Verify `.env` file has `MC_CUSTOMER_ID` and `MC_AUTH_TOKEN`
   - Backend should be able to call MessageCentral APIs

### Test Scenario 1: User with Phone Number

1. **Login** to the application with a user account
2. **Navigate** to Profile page (click profile avatar/name)
3. **Check Personal Details** section:
   - Phone number should be displayed
   - Should show "Unverified" badge next to phone number (orange)
   - Mobile verification card should appear below

4. **Click "Verify Mobile Number"** button
   - Button should show "Sending OTP..." while loading
   - OTP should be sent to the mobile number via SMS
   - Success message should appear: "OTP sent successfully to your mobile number."
   - Form should appear with OTP input field

5. **Enter OTP** received via SMS
   - Enter the 6-digit OTP code
   - Click "Verify OTP" button
   - Button should show "Verifying..." while loading

6. **Successful Verification**
   - Success message: "Mobile number verified successfully!"
   - OTP form should disappear
   - Phone badge should change to "✓ Verified" (green)
   - Verification card should disappear
   - User data should be updated in backend

### Test Scenario 2: Invalid OTP

1. Follow steps 1-4 from Scenario 1
2. **Enter Wrong OTP** (e.g., "123456")
3. **Click "Verify OTP"**
   - Error message should appear: "Invalid OTP. Please try again."
   - Form should remain visible
   - Can try again with correct OTP

### Test Scenario 3: Cancel OTP Flow

1. Follow steps 1-4 from Scenario 1
2. **Click "Cancel"** button
   - OTP form should disappear
   - Should return to "Verify Mobile Number" button
   - No verification status change

### Test Scenario 4: User Without Phone Number

1. **Login** with a user that has no phone number
2. **Navigate** to Profile page
3. **Check Personal Details**:
   - Phone should show "—" (empty)
   - No verification badge
   - No verification card

4. **Add Phone Number**:
   - Click "Edit profile" tab
   - Add a 10-digit phone number
   - Save changes
   - Return to "Overview" tab

5. **Verify Mobile**:
   - Verification card should now appear
   - Follow Scenario 1 steps

### Test Scenario 5: Already Verified User

1. **Login** with a user whose mobile is already verified
2. **Navigate** to Profile page
3. **Check Personal Details**:
   - Phone number displayed
   - "✓ Verified" badge (green) next to phone
   - No verification card (already verified)

### Test Scenario 6: API Error Handling

1. **Stop Backend** temporarily
2. **Try to send OTP**
   - Error message should appear with connection error
   - No crash or blank screen

3. **Restart Backend**
4. **Try again** - should work normally

### Backend API Testing (Optional)

#### Test Send OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "9876543210"}'
```

Expected Response:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "responseCode": 200,
    "message": "SUCCESS",
    "data": {
      "verificationId": "uuid-here",
      "mobileNumber": "9876543210",
      "timeout": "120"
    }
  }
}
```

#### Test Validate OTP
```bash
curl -X POST http://localhost:8080/api/verifynow/validate-otp \
  -H "Content-Type: application/json" \
  -d '{
    "verificationId": "uuid-from-send-response",
    "mobileNumber": "9876543210",
    "code": "123456"
  }'
```

Expected Response (Success):
```json
{
  "success": true,
  "message": "OTP validated successfully",
  "data": {
    "valid": true,
    "message": "SUCCESS"
  }
}
```

#### Test Update Verification Status
```bash
curl -X POST http://localhost:8080/api/v1/users/me/verify-mobile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210",
  "status": "ACTIVE",
  "createdAt": "2024-09-17T10:00:00",
  "updatedAt": "2024-09-17T14:00:00",
  "totpEnabled": false,
  "mobileVerified": true,
  "mobileVerifiedAt": "2024-09-17T14:00:00"
}
```

## Database Verification

After successful verification, check the database:

```sql
SELECT id, email, phone, mobile_verified, mobile_verified_at 
FROM users 
WHERE email = 'test@example.com';
```

Expected:
- `mobile_verified` = `true` (or `1`)
- `mobile_verified_at` = timestamp of verification

## Verification Checklist

- [ ] Backend compiles successfully
- [ ] Frontend runs without errors
- [ ] User can see verification status badge
- [ ] "Verify Mobile Number" button appears for unverified users
- [ ] OTP is sent successfully to mobile
- [ ] OTP form appears after sending OTP
- [ ] Valid OTP verification succeeds
- [ ] Invalid OTP shows error message
- [ ] Cancel button works correctly
- [ ] Verified badge appears after successful verification
- [ ] Verification card disappears after verification
- [ ] User data is updated in backend
- [ ] Database reflects verification status
- [ ] Already verified users don't see verification card
- [ ] Error messages display correctly
- [ ] Loading states work properly
- [ ] Mobile number formatting is correct (10 digits)

## Known Limitations

1. **Phone Number Format**: Expects 10-digit Indian mobile numbers (without country code)
2. **OTP Expiry**: OTP typically expires in 2 minutes (120 seconds)
3. **Re-verification**: Once verified, users cannot re-verify the same number
4. **Country Code**: Currently hardcoded to India (+91) in MessageCentral config

## Troubleshooting

### OTP Not Received
- Check MessageCentral account has SMS credits
- Verify mobile number format (10 digits, no spaces)
- Check MessageCentral dashboard for delivery status
- Ensure `.env` has correct credentials

### Verification Fails
- Check browser console for errors
- Verify backend logs for API errors
- Ensure authentication token is valid
- Check network tab for API call responses

### Badge Not Updating
- Refresh the page
- Check if backend updated the user record
- Verify `getCurrentUser()` API returns updated data
- Check browser console for state update errors

## Success Criteria

✅ All checklist items pass  
✅ Complete OTP flow works end-to-end  
✅ Database correctly stores verification status  
✅ UI properly reflects verification state  
✅ Error handling works for all scenarios  

## Files Modified

### Backend
- `busbooking/src/main/java/com/yuvan/busbooking/user/entity/User.java`
- `busbooking/src/main/java/com/yuvan/busbooking/user/dto/UserResponse.java`
- `busbooking/src/main/java/com/yuvan/busbooking/user/service/UserService.java`
- `busbooking/src/main/java/com/yuvan/busbooking/user/controller/UserController.java`

### Frontend
- `frontend/src/api.js`
- `frontend/src/components/profile/ProfilePage.jsx`

---

**Implementation Date**: September 17, 2026  
**Status**: ✅ Ready for Testing
