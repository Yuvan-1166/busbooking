-- Remove mobile verification fields from users table
-- SMS OTP feature (Twilio/MessageCentral) has been removed

ALTER TABLE users 
DROP COLUMN IF EXISTS mobile_number,
DROP COLUMN IF EXISTS mobile_verified,
DROP COLUMN IF EXISTS mobile_verified_at;

-- Remove mobile OTP records from OtpVerification table if they exist
DELETE FROM otp_verification WHERE purpose = 'MOBILE_VERIFICATION';
