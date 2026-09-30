package com.yuvan.busbooking.auth.otp.channel;

import com.yuvan.busbooking.auth.otp.exception.OtpDeliveryException;
import com.yuvan.busbooking.common.exception.OtpVerificationException;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.verifynow.dto.OtpSendResponse;
import com.yuvan.busbooking.verifynow.dto.OtpValidateResponse;
import com.yuvan.busbooking.verifynow.service.VerifyNowOtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.regex.Pattern;


@Component
@RequiredArgsConstructor
@Slf4j
public class MobileOtpChannel implements OtpChannel {

    private static final int NATIONAL_NUMBER_LENGTH = 10;
    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[0-9]{10}$");

    private final VerifyNowOtpService verifyNowOtpService;
    private final UserRepository userRepository;

    @Override
    public OtpChannelType getType() {
        return OtpChannelType.MOBILE;
    }

    @Override
    public String label() {
        return "mobile number";
    }

    @Override
    public String normalizeTarget(String target) {
        if (target == null) {
            return null;
        }
        String digits = target.replaceAll("\\D", "");
        if (digits.length() > NATIONAL_NUMBER_LENGTH) {
            return digits.substring(digits.length() - NATIONAL_NUMBER_LENGTH);
        }
        return digits;
    }

    @Override
    public void validateTarget(String target) {
        if (target == null || target.isBlank()) {
            throw new IllegalArgumentException("A mobile number is required.");
        }
        if (!MOBILE_PATTERN.matcher(target).matches()) {
            throw new IllegalArgumentException(
                    "Enter a valid 10-digit mobile number.");
        }
    }

    @Override
    public String maskTarget(String target) {
        if (target == null || target.length() < 4) {
            return "****";
        }
        return "******" + target.substring(target.length() - 4);
    }

    @Override
    public boolean isProviderManaged() {
        return true;
    }

    @Override
    public OtpDispatch dispatch(OtpDispatchCommand command) {
        try {
            OtpSendResponse response = verifyNowOtpService.sendOtp(command.target());
            String verificationId =
                    response == null || response.getData() == null
                            ? null
                            : response.getData().getVerificationId();

            if (verificationId == null || verificationId.isBlank()) {
                throw new OtpDeliveryException(
                        "The SMS provider did not return a verification reference.");
            }

            log.debug("Verification reference issued for mobile {}",
                    maskTarget(command.target()));
            return OtpDispatch.external(verificationId);
        } catch (OtpDeliveryException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new OtpDeliveryException("Failed to send the verification SMS.", e);
        }
    }

    @Override
    public boolean confirmCode(String externalReference, String submittedCode) {
        if (externalReference == null || externalReference.isBlank()) {
            throw new OtpVerificationException(
                    "This verification request is no longer valid. Please request a new code.");
        }

        OtpValidateResponse response =
                verifyNowOtpService.validateOtp(externalReference, submittedCode);

        boolean completed = response != null
                && response.getData() != null
                && "VERIFICATION_COMPLETED".equalsIgnoreCase(
                        response.getData().getVerificationStatus());

        if (!completed) {
            throw new OtpVerificationException("Incorrect code. Please try again.");
        }
        return true;
    }

    @Override
    public Optional<User> findOwner(String target) {
        String nationalNumber = normalizeTarget(target);
        if (nationalNumber == null || nationalNumber.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findFirstByPhoneEndingWithOrderByIdAsc(nationalNumber);
    }
}
