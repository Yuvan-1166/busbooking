package com.yuvan.busbooking.auth.otp.channel;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.exception.OtpDeliveryException;
import com.yuvan.busbooking.auth.service.EmailService;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Email delivery channel backed by SMTP.
 *
 * <p>The code is generated and hashed by the OTP service, so the channel only
 * has to pick the template that matches the purpose and hand the code to
 * {@link EmailService}. Accounts are looked up by email address.</p>
 */
@Component
@RequiredArgsConstructor
public class EmailOtpChannel implements OtpChannel {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    private final EmailService emailService;
    private final UserRepository userRepository;

    @Override
    public OtpChannelType getType() {
        return OtpChannelType.EMAIL;
    }

    @Override
    public String label() {
        return "email";
    }

    @Override
    public String normalizeTarget(String target) {
        return target == null ? null : target.trim().toLowerCase(Locale.ROOT);
    }

    @Override
    public void validateTarget(String target) {
        if (target == null || target.isBlank()) {
            throw new IllegalArgumentException("An email address is required.");
        }
        if (!EMAIL_PATTERN.matcher(target).matches()) {
            throw new IllegalArgumentException("Enter a valid email address.");
        }
    }

    @Override
    public String maskTarget(String target) {
        if (target == null || target.isBlank()) {
            return "";
        }
        int at = target.indexOf('@');
        if (at <= 1) {
            return "***" + target.substring(Math.max(0, target.length() - 2));
        }
        return target.charAt(0) + "***" + target.substring(at);
    }

    @Override
    public boolean isProviderManaged() {
        return false;
    }

    @Override
    public OtpDispatch dispatch(OtpDispatchCommand command) {
        if (!command.hasCode()) {
            throw new IllegalStateException("Email OTPs require a locally issued code");
        }
        try {
            if (command.purpose() == OtpPurpose.PASSWORD_RESET) {
                emailService.sendPasswordResetOtp(
                        command.target(), command.code(), command.expiryMinutes());
            } else {
                emailService.sendOtp(
                        command.target(), command.code(), command.expiryMinutes());
            }
        } catch (RuntimeException e) {
            throw new OtpDeliveryException("Failed to send the verification email.", e);
        }
        return OtpDispatch.local();
    }

    @Override
    public void confirmCode(String externalReference, String submittedCode) {
        throw new UnsupportedOperationException(
                "Email codes are verified by the OTP service, not by the channel.");
    }

    @Override
    public Optional<User> findOwner(String target) {
        return userRepository.findByEmail(normalizeTarget(target));
    }
}
