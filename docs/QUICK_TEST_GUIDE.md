# Quick Test Guide - Auth Flow

## Test 1: Register New User (No 2FA)
1. Go to `/login` → Click "Register"
2. Fill form → Submit
3. Check email → Enter 6-digit OTP
4. ✅ Should show "Email verified! You can now sign in"
5. Login with credentials
6. ✅ Should login immediately (no TOTP prompt)

## Test 2: Enable 2FA
1. Login → Go to `/profile`
2. Click "Security (2FA)" tab
3. Verify shows "2FA is currently disabled"
4. Click "Enable 2FA"
5. Scan QR code with Zoho OneAuth or Google Authenticator
6. Enter 6-digit code from app
7. ✅ Should redirect to profile with success message
8. Verify shows "2FA is currently enabled"

## Test 3: Login with 2FA
1. Logout
2. Enter email/password
3. ✅ Should show TOTP verification page
4. Enter code from authenticator app
5. ✅ Should login successfully

## Test 4: Disable 2FA
1. Go to Profile → Security
2. Click "Disable 2FA"
3. Enter password in prompt
4. ✅ Should show success message
5. Verify shows "2FA is currently disabled"
6. Logout and login
7. ✅ Should login without TOTP prompt

## Expected Results

✅ **Registration**: User active after OTP, can login immediately
✅ **Profile**: Shows actual 2FA status from database
✅ **Enable 2FA**: Works with authenticated session
✅ **Login with 2FA**: Prompts for TOTP code
✅ **Login without 2FA**: No TOTP prompt
✅ **Disable 2FA**: Requires password, removes 2FA requirement

## Status

✅ Backend compiles successfully
✅ Frontend builds successfully
✅ All changes applied
✅ Ready for testing
