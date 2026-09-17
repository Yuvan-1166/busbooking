# Mobile Verification - Quick Reference

## 🎯 What Was Built

A complete mobile number verification feature using MessageCentral SMS OTP, integrated into the user profile page.

## 📍 Location

**Frontend**: Profile Page → Overview Tab → Personal Details Section  
**Backend**: `/api/v1/users/me/verify-mobile` endpoint

## 🔄 User Flow

1. User has phone number in profile → sees "Unverified" badge
2. Clicks "Verify Mobile Number" button
3. Receives OTP via SMS (MessageCentral)
4. Enters 6-digit OTP code
5. Clicks "Verify OTP"
6. ✅ Badge changes to "✓ Verified" (green)

## 🔌 API Endpoints

### Frontend API Methods
```javascript
// Send OTP to mobile number
api.sendMobileOtp(mobileNumber)

// Validate OTP code
api.validateMobileOtp(verificationId, mobileNumber, code)

// Update user verification status
api.updateMobileVerificationStatus()
```

### Backend Endpoints
```
POST /api/verifynow/send-otp
POST /api/verifynow/validate-otp
POST /api/v1/users/me/verify-mobile
```

## 💾 Database Schema

**User Table** - New Fields:
- `mobile_verified` (BOOLEAN, default: false)
- `mobile_verified_at` (TIMESTAMP, nullable)

## 🎨 UI Components

**Verification Badge**
```
Unverified (Orange) → ✓ Verified (Green)
```

**Verification Card** (shown when unverified)
- Send OTP button
- OTP input form (after sending)
- Verify/Cancel buttons

## 🔐 Security

- ✅ Requires authentication
- ✅ OTP expires in 2 minutes
- ✅ Mobile number masked in logs
- ✅ One-time verification per number

## 📱 Phone Number Format

- **Expected**: 10 digits (Indian numbers)
- **Example**: `9876543210`
- **Country Code**: Handled by backend (+91)

## 🚀 Quick Test

1. Login to app
2. Go to Profile page
3. Check phone has "Unverified" badge
4. Click "Verify Mobile Number"
5. Check SMS for OTP
6. Enter OTP and verify
7. Verify badge shows "✓ Verified"

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| OTP not received | Check MessageCentral credits & phone format |
| Invalid OTP error | Check code is correct & not expired |
| Badge not updating | Refresh page or check backend logs |
| No verification card | Ensure phone number is added to profile |

## 📦 Dependencies

**Backend**:
- MessageCentral VerifyNow API (already configured)
- Existing User entity and services

**Frontend**:
- React state management
- Existing API helper
- ProfilePage component

## ✅ Completion Status

- [x] Backend entities updated
- [x] Backend endpoints created
- [x] Frontend API helper updated
- [x] Frontend UI implemented
- [x] MessageCentral integration working
- [ ] End-to-end testing (next step)

## 📚 Related Documentation

- `MOBILE_VERIFICATION_TEST_GUIDE.md` - Complete testing guide
- `busbooking/VERIFYNOW_README.md` - MessageCentral API docs
- `busbooking/VERIFYNOW_QUICKSTART.md` - MessageCentral setup

## 🎯 Next Steps

1. Test with real mobile number
2. Verify database updates correctly
3. Test error scenarios
4. Verify on different screen sizes
5. Consider adding re-verification flow (optional)

---

**Quick Commands**

```bash
# Start backend
cd busbooking
.\mvnw.cmd spring-boot:run

# Start frontend
cd frontend
npm run dev

# Check database
SELECT email, phone, mobile_verified, mobile_verified_at FROM users;
```
