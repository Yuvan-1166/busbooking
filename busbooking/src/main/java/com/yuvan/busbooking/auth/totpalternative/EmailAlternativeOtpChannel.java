package com.yuvan.busbooking.auth.totpalternative;

import com.yuvan.busbooking.auth.dto.TotpAlternativeOtpResponse;
import com.yuvan.busbooking.auth.entity.OtpStatus;
import com.yuvan.busbooking.auth.entity.TotpAlternativeOtp;
import com.yuvan.busbooking.auth.entity.TotpAlternativeType;
import com.yuvan.busbooking.auth.repository.TotpAlternativeOtpRepository;
import com.yuvan.busbooking.auth.service.EmailService;
import com.yuvan.busbooking.user.entity.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Email delivery channel backed by the internal {@link EmailService}.
 * <p>The OTP is generated and verified locally against the persisted hash
 * of the sent code.</p>
 */
@Component
@Slf4j
public class EmailAlternativeOtpChannel extends AbstractAlternativeOtpChannel {

    private final TotpAlternativeOtpRepository alternativeOtpRepository;
    private final EmailService emailService;

    public EmailAlternativeOtpChannel(
            PasswordEncoder passwordEncoder,
            TotpAlternativeOtpRepository alternativeOtpRepository,
            EmailService emailService
    ) {
        super(passwordEncoder);
        this.alternativeOtpRepository = alternativeOtpRepository;
        this.emailService = emailService;
    }

    @Override
    public TotpAlternativeType getType() {
        return TotpAlternativeType.EMAIL;
    }

    @Override
    public TotpAlternativeOtpResponse send(User user, String ipAddress, String userAgent) {
        String email = user.getEmail();

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("User does not have an email address");
        }

        log.info("Sending Email OTP to user {} with email: {}", user.getId(), maskEmail(email));

        try {
            String otp = generateOtpCode();
            String otpHash = generateOtpHash(otp);

            TotpAlternativeOtp otpRecord = TotpAlternativeOtp.builder()
                    .user(user)
                    .method(TotpAlternativeType.EMAIL)
                    .recipient(email)
                    .otpHash(otpHash)
                    .status(OtpStatus.ACTIVE)
                    .attemptCount(0)
                    .expiresAt(LocalDateTime.now().plusSeconds(otpTtlSeconds))
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();

            TotpAlternativeOtp savedOtp = alternativeOtpRepository.save(otpRecord);

            emailService.sendOtp(email, otp, otpTtlSeconds / 60);

            log.info("Email OTP sent successfully. Session ID: {}", savedOtp.getId());

            return buildSendResponse(
                    savedOtp,
                    "OTP sent to your email",
                    maskEmail(email),
                    null);
        } catch (Exception e) {
            log.error("Failed to send email OTP for user {}: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to send email OTP: " + e.getMessage());
        }
    }

    @Override
    public boolean verify(TotpAlternativeOtp otp, String code) {
        return passwordEncoder.matches(code, otp.getOtpHash());
    }
}