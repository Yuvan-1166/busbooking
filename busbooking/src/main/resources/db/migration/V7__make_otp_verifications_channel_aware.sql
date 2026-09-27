-- Make otp_verifications channel-aware so the unified OTP flow can store codes
-- issued to any destination (email today, mobile via Message Central, more later)
-- in the same table.
--
-- The destination column keeps its historical name (`email`) even though it now
-- holds whatever the resolved channel delivers to: Hibernate is mapped to it as
-- the channel-agnostic `target` field, so renaming the column is cosmetic and
-- left out to avoid a window where the app and the schema disagree.
--
-- `channel` records which OtpChannel issued the code and `external_reference`
-- keeps the provider-side handle for channels that generate and validate the
-- code themselves (e.g. the Message Central verification id).

ALTER TABLE otp_verifications
    MODIFY COLUMN otp_hash VARCHAR(255) NULL,
    ADD COLUMN channel VARCHAR(20) NULL AFTER purpose,
    ADD COLUMN external_reference VARCHAR(100) NULL AFTER channel;

-- Codes that predate channels were all issued over email.
UPDATE otp_verifications SET channel = 'EMAIL' WHERE channel IS NULL;
