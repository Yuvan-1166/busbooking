package com.yuvan.busbooking.auth.totpalternative;

import com.yuvan.busbooking.auth.dto.TotpAlternativeOtpResponse;
import com.yuvan.busbooking.auth.entity.OtpStatus;
import com.yuvan.busbooking.auth.entity.TotpAlternativeOtp;
import com.yuvan.busbooking.auth.entity.TotpAlternativeType;
import com.yuvan.busbooking.auth.repository.TotpAlternativeOtpRepository;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.verifynow.dto.OtpSendResponse;
import com.yuvan.busbooking.verifynow.dto.OtpValidateResponse;
import com.yuvan.busbooking.verifynow.service.VerifyNowOtpService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * SMS delivery channel backed by the VerifyNow API.
 * <p>The OTP itself is delivered and validated externally by VerifyNow;
 * the persisted record stores the external verification ID for later lookup.</p>
 */
@Component
@Slf4j
public class SmsAlternativeOtpChannel extends AbstractAlternativeOtpChannel {

    private final TotpAlternativeOtpRepository alternativeOtpRepository;
    private final VerifyNowOtpService verifyNowOtpService;

    public SmsAlternativeOtpChannel(
            PasswordEncoder passwordEncoder,
            TotpAlternativeOtpRepository alternativeOtpRepository,
            VerifyNowOtpService verifyNowOtpService
    ) {
        super(passwordEncoder);
        this.alternativeOtpRepository = alternativeOtpRepository;
        this.verifyNowOtpService = verifyNowOtpService;
    }

    @Override
    public TotpAlternativeType getType() {
        return TotpAlternativeType.SMS;
    }

    @Override
    public TotpAlternativeOtpResponse send(User user, String ipAddress, String userAgent) {
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            throw new IllegalArgumentException(
                    "Phone number is not registered. Please add and verify your phone number from your profile.");
        }

        if (!Boolean.TRUE.equals(user.getMobileVerified())) {
            throw new IllegalArgumentException(
                    "Phone number is not verified. Please verify your phone number before using SMS authentication.");
        }

        String mobileNumber = user.getPhone();

        log.info("Sending SMS OTP to user {} with mobile: ****{}",
                user.getId(), mobileNumber.substring(Math.max(0, mobileNumber.length() - 4)));

        try {
            OtpSendResponse verifynowResponse = verifyNowOtpService.sendOtp(mobileNumber);

            if (verifynowResponse == null || verifynowResponse.getData() == null) {
                log.error("VerifyNow returned empty response for user {}", user.getId());
                throw new RuntimeException("Failed to send SMS OTP");
            }

            String verificationId = verifynowResponse.getData().getVerificationId();

            String otpHash = generateOtpHash(generateOtpCode());

            TotpAlternativeOtp otp = TotpAlternativeOtp.builder()
                    .user(user)
                    .method(TotpAlternativeType.SMS)
                    .verificationId(verificationId)
                    .recipient(mobileNumber)
                    .otpHash(otpHash)
                    .status(OtpStatus.ACTIVE)
                    .attemptCount(0)
                    .expiresAt(LocalDateTime.now().plusSeconds(otpTtlSeconds))
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            TotpAlternativeOtp savedOtp = alternativeOtpRepository.save(otp);

            log.info("SMS OTP sent successfully. Session ID: {}", savedOtp.getId());

            return buildSendResponse(
                    savedOtp,
                    "OTP sent to your registered mobile number",
                    maskMobileNumber(mobileNumber),
                    verificationId);
        } catch (Exception e) {
            log.error("Failed to send SMS OTP for user {}: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to send SMS OTP: " + e.getMessage());
        }
    }

    @Override
    public boolean verify(TotpAlternativeOtp otp, String code) {
        if (otp.getVerificationId() == null) {
            log.error("SMS OTP missing verification ID");
            return false;
        }

        OtpValidateResponse response = verifyNowOtpService.validateOtp(otp.getVerificationId(), code);

        if (response == null || response.getData() == null) {
            log.error("VerifyNow returned empty response for verification: {}", otp.getVerificationId());
            return false;
        }

        boolean isValid = "VERIFICATION_COMPLETED".equalsIgnoreCase(
                response.getData().getVerificationStatus()
        );

        log.info("SMS OTP verification result: {}", isValid);
        return isValid;
    }
}