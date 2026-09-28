package com.yuvan.busbooking.auth.otp.service;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.entity.OtpStatus;
import com.yuvan.busbooking.auth.entity.OtpVerification;
import com.yuvan.busbooking.auth.otp.channel.OtpChannel;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelFactory;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import com.yuvan.busbooking.auth.otp.channel.OtpDispatch;
import com.yuvan.busbooking.auth.otp.channel.OtpDispatchCommand;
import com.yuvan.busbooking.auth.otp.dto.OtpVerifyResponse;
import com.yuvan.busbooking.auth.otp.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.otp.dto.VerifyOtpRequest;
import com.yuvan.busbooking.auth.otp.flow.OtpFlow;
import com.yuvan.busbooking.auth.otp.flow.OtpFlowFactory;
import com.yuvan.busbooking.auth.repository.OtpVerificationRepository;
import com.yuvan.busbooking.common.exception.OtpVerificationException;
import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpVerificationRepository otpRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpFlowFactory flowFactory;
    private final OtpChannelFactory channelFactory;
    private final int expiryMinutes;
    private final int maxAttempts;

    public OtpService(
            OtpVerificationRepository otpRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            OtpFlowFactory flowFactory,
            OtpChannelFactory channelFactory,
            @Value("${app.otp.expiry-minutes:10}") int expiryMinutes,
            @Value("${app.otp.max-attempts:5}") int maxAttempts
    ) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.flowFactory = flowFactory;
        this.channelFactory = channelFactory;
        this.expiryMinutes = expiryMinutes;
        this.maxAttempts = maxAttempts;
    }

    @Transactional
    public OtpVerifyResponse send(SendOtpRequest request) {
        OtpChannel channel = channelFactory.getChannel(request.resolvedChannel());
        OtpFlow flow = flowFactory.getFlow(request.resolvedPurpose());

        String target = channel.normalizeTarget(request.target());
        channel.validateTarget(target);

        flow.validateForSend(resolveOwner(channel, target));

        supersedePrevious(channel.getType(), target, flow.getPurpose());

        dispatch(channel, flow, target);

        return OtpVerifyResponse.of(
                "Verification code sent to " + channel.maskTarget(target),
                channel.getType(),
                flow.getPurpose(),
                expiryMinutes
        );
    }

    @Transactional(noRollbackFor = OtpVerificationException.class)
    public OtpVerifyResponse confirm(VerifyOtpRequest request) {
        OtpChannel channel = channelFactory.getChannel(request.resolvedChannel());
        OtpPurpose purpose = request.resolvedPurpose();

        String target = channel.normalizeTarget(request.target());
        channel.validateTarget(target);

        OtpVerification record = requireUsableRecord(channel, target, purpose);

        if (channel.isProviderManaged()) {
            channel.confirmCode(record.getExternalReference(), request.otp());
        } else if (!passwordEncoder.matches(request.otp(), record.getOtpHash())) {
            registerFailedAttempt(record);
        }

        markVerified(record);

        User user = resolveOwner(channel, target);
        flowFactory.getFlow(purpose).applyPostVerification(user);
        userRepository.save(user);

        return OtpVerifyResponse.of(
                capitalise(channel.label()) + " verified successfully.",
                channel.getType(),
                purpose,
                expiryMinutes
        );
    }

    private void dispatch(OtpChannel channel, OtpFlow flow, String target) {
        OtpVerification record = new OtpVerification();
        record.setTarget(target);
        record.setChannel(channel.getType());
        record.setPurpose(flow.getPurpose());
        record.setStatus(OtpStatus.ACTIVE);
        record.setAttempts(0);
        record.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));

        if (channel.isProviderManaged()) {
            // Dispatch first: a delivery failure must not leave an ACTIVE record.
            OtpDispatch dispatched = channel.dispatch(
                    OtpDispatchCommand.providerIssued(
                            target, flow.getPurpose(), expiryMinutes));
            record.setExternalReference(dispatched.externalReference());
        } else {
            String plainOtp = generateSixDigitOtp();
            record.setOtpHash(passwordEncoder.encode(plainOtp));
            channel.dispatch(
                    OtpDispatchCommand.locallyIssued(
                            target, plainOtp, flow.getPurpose(), expiryMinutes));
        }

        otpRepository.save(record);
    }

    private OtpVerification requireUsableRecord(
            OtpChannel channel,
            String target,
            OtpPurpose purpose
    ) {
        OtpVerification record = otpRepository
                .findTopByTargetAndChannelAndPurposeOrderByCreatedAtDesc(
                        target, channel.getType(), purpose)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No verification code found for this " + channel.label()
                                + ". Please request a new one."));

        if (record.getStatus() == OtpStatus.VERIFIED) {
            throw new IllegalStateException(
                    "This verification code has already been used.");
        }

        if (record.getStatus() == OtpStatus.EXPIRED
                || LocalDateTime.now().isAfter(record.getExpiresAt())) {
            expire(record);
            throw new OtpVerificationException(
                    "The verification code has expired. Please request a new one.");
        }

        if (record.getAttempts() >= maxAttempts) {
            expire(record);
            throw new OtpVerificationException(
                    "Too many incorrect attempts. Please request a new code.");
        }

        return record;
    }

    private void registerFailedAttempt(OtpVerification record) {
        record.setAttempts(record.getAttempts() + 1);

        if (record.getAttempts() >= maxAttempts) {
            expire(record);
            throw new OtpVerificationException(
                    "Too many incorrect attempts. Please request a new code.");
        }

        otpRepository.save(record);

        int remaining = maxAttempts - record.getAttempts();
        throw new OtpVerificationException(
                "Incorrect code. " + remaining
                        + " attempt" + (remaining == 1 ? "" : "s") + " remaining.");
    }

    private void markVerified(OtpVerification record) {
        record.setStatus(OtpStatus.VERIFIED);
        record.setVerifiedAt(LocalDateTime.now());
        otpRepository.save(record);
    }

    private void expire(OtpVerification record) {
        record.setStatus(OtpStatus.EXPIRED);
        otpRepository.save(record);
    }

    private void supersedePrevious(
            OtpChannelType channelType,
            String target,
            OtpPurpose purpose
    ) {
        otpRepository
                .findTopByTargetAndChannelAndPurposeOrderByCreatedAtDesc(
                        target, channelType, purpose)
                .filter(existing -> existing.getStatus() == OtpStatus.ACTIVE)
                .ifPresent(this::expire);
    }

    private User resolveOwner(OtpChannel channel, String target) {
        return channel.findOwner(target)
                .or(() -> pendingIdentityOwner())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No account found for " + channel.maskTarget(target)));
    }

    private Optional<User> pendingIdentityOwner() {
        String currentUser = currentUserName();
        if (currentUser == null || !currentUser.startsWith("twitter")) {
            return Optional.empty();
        }
        return userRepository.findByEmail(currentUser);
    }

    private String currentUserName() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getName();
    }

    private String generateSixDigitOtp() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private String capitalise(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        return Character.toUpperCase(value.charAt(0)) + value.substring(1);
    }
}
