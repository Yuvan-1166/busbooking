package com.yuvan.busbooking.auth.otp.service;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.entity.OtpStatus;
import com.yuvan.busbooking.auth.entity.OtpVerification;
import com.yuvan.busbooking.auth.otp.channel.OtpChannel;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelFactory;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import com.yuvan.busbooking.auth.otp.channel.OtpDispatch;
import com.yuvan.busbooking.auth.otp.channel.OtpDispatchCommand;
import com.yuvan.busbooking.auth.otp.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.otp.dto.VerifyOtpRequest;
import com.yuvan.busbooking.auth.otp.flow.OtpFlow;
import com.yuvan.busbooking.auth.otp.flow.OtpFlowFactory;
import com.yuvan.busbooking.auth.repository.OtpVerificationRepository;
import com.yuvan.busbooking.common.exception.OtpVerificationException;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The flow is shared by every delivery method, so these tests drive the same
 * two entry points with a locally issued channel and with a provider-managed
 * one and assert that only the channel-specific parts differ.
 */
@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    private static final int EXPIRY_MINUTES = 10;
    private static final int MAX_ATTEMPTS = 5;
    private static final String EMAIL = "rider@example.com";
    private static final String MOBILE = "9876543210";
    private static final String PROVIDER_REFERENCE = "verify-abc-123";

    @Mock
    private OtpVerificationRepository otpRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private OtpFlowFactory flowFactory;

    @Mock
    private OtpChannelFactory channelFactory;

    @Mock
    private OtpChannel channel;

    @Mock
    private OtpFlow flow;

    @Mock
    private User user;

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService(
                otpRepository,
                userRepository,
                passwordEncoder,
                flowFactory,
                channelFactory,
                EXPIRY_MINUTES,
                MAX_ATTEMPTS
        );
    }

    @Test
    void locallyIssuedChannelStoresTheHashedCodeAndReceivesThePlainOne() {
        givenChannel(OtpChannelType.EMAIL, EMAIL, false);
        givenOwner(EMAIL);
        givenRegistrationFlow();
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-code");

        otpService.send(new SendOtpRequest(EMAIL, null, null));

        OtpVerification record = capturedRecord();
        assertThat(record.getOtpHash()).isEqualTo("hashed-code");
        assertThat(record.getExternalReference()).isNull();
        assertThat(record.getChannel()).isEqualTo(OtpChannelType.EMAIL);
        assertThat(record.getTarget()).isEqualTo(EMAIL);
        assertThat(record.getStatus()).isEqualTo(OtpStatus.ACTIVE);
        assertThat(record.getAttempts()).isZero();

        OtpDispatchCommand dispatched = capturedCommand();
        assertThat(dispatched.target()).isEqualTo(EMAIL);
        assertThat(dispatched.purpose()).isEqualTo(OtpPurpose.REGISTRATION);
        assertThat(dispatched.expiryMinutes()).isEqualTo(EXPIRY_MINUTES);
        assertThat(dispatched.code()).matches("\\d{6}");
    }

    @Test
    void providerManagedChannelStoresTheProviderReferenceInsteadOfACode() {
        givenChannel(OtpChannelType.MOBILE, MOBILE, true);
        givenOwner(MOBILE);
        when(flowFactory.getFlow(OtpPurpose.PASSWORD_RESET)).thenReturn(flow);
        when(flow.getPurpose()).thenReturn(OtpPurpose.PASSWORD_RESET);
        when(channel.dispatch(any(OtpDispatchCommand.class)))
                .thenReturn(OtpDispatch.external(PROVIDER_REFERENCE));

        otpService.send(new SendOtpRequest(
                MOBILE, OtpChannelType.MOBILE, OtpPurpose.PASSWORD_RESET));

        OtpVerification record = capturedRecord();
        assertThat(record.getOtpHash()).isNull();
        assertThat(record.getExternalReference()).isEqualTo(PROVIDER_REFERENCE);
        assertThat(record.getChannel()).isEqualTo(OtpChannelType.MOBILE);
        assertThat(record.getPurpose()).isEqualTo(OtpPurpose.PASSWORD_RESET);
        assertThat(capturedCommand().hasCode()).isFalse();
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void sendingSupersedesTheCodeStillActiveForTheSameTargetAndPurpose() {
        givenChannel(OtpChannelType.EMAIL, EMAIL, false);
        givenOwner(EMAIL);
        givenRegistrationFlow();
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-code");

        OtpVerification previous = activeRecord(EMAIL, OtpChannelType.EMAIL);
        when(otpRepository
                .findTopByTargetAndChannelAndPurposeOrderByCreatedAtDesc(
                        EMAIL, OtpChannelType.EMAIL, OtpPurpose.REGISTRATION))
                .thenReturn(Optional.of(previous));

        otpService.send(new SendOtpRequest(EMAIL, null, null));

        assertThat(previous.getStatus()).isEqualTo(OtpStatus.EXPIRED);
    }

    @Test
    void providerManagedConfirmAsksTheChannelAndAppliesTheFlow() {
        givenChannel(OtpChannelType.MOBILE, MOBILE, true);
        givenOwner(MOBILE);
        when(flowFactory.getFlow(OtpPurpose.PASSWORD_RESET)).thenReturn(flow);

        OtpVerification record = activeRecord(MOBILE, OtpChannelType.MOBILE);
        record.setExternalReference(PROVIDER_REFERENCE);
        givenStoredRecord(MOBILE, OtpChannelType.MOBILE, OtpPurpose.PASSWORD_RESET, record);

        otpService.confirm(new VerifyOtpRequest(
                MOBILE, "482913", OtpChannelType.MOBILE, OtpPurpose.PASSWORD_RESET));

        verify(channel).confirmCode(PROVIDER_REFERENCE, "482913");
        assertThat(record.getStatus()).isEqualTo(OtpStatus.VERIFIED);
        assertThat(record.getVerifiedAt()).isNotNull();
        verify(flow).applyPostVerification(user);
        verify(userRepository).save(user);
    }

    @Test
    void locallyIssuedConfirmComparesAgainstTheStoredHash() {
        givenChannel(OtpChannelType.EMAIL, EMAIL, false);
        givenOwner(EMAIL);
        when(flowFactory.getFlow(OtpPurpose.REGISTRATION)).thenReturn(flow);

        OtpVerification record = activeRecord(EMAIL, OtpChannelType.EMAIL);
        record.setOtpHash("hashed-code");
        givenStoredRecord(EMAIL, OtpChannelType.EMAIL, OtpPurpose.REGISTRATION, record);
        when(passwordEncoder.matches("123456", "hashed-code")).thenReturn(true);

        otpService.confirm(new VerifyOtpRequest(EMAIL, "123456", null, null));

        assertThat(record.getStatus()).isEqualTo(OtpStatus.VERIFIED);
        verify(flow).applyPostVerification(user);
    }

    @Test
    void incorrectCodeCountsDownTheRemainingAttempts() {
        givenChannel(OtpChannelType.EMAIL, EMAIL, false);

        OtpVerification record = activeRecord(EMAIL, OtpChannelType.EMAIL);
        record.setOtpHash("hashed-code");
        givenStoredRecord(EMAIL, OtpChannelType.EMAIL, OtpPurpose.REGISTRATION, record);
        when(passwordEncoder.matches("000000", "hashed-code")).thenReturn(false);

        assertThatThrownBy(() -> otpService.confirm(
                new VerifyOtpRequest(EMAIL, "000000", null, null)))
                .isInstanceOf(OtpVerificationException.class)
                .hasMessage("Incorrect code. 4 attempts remaining.");

        assertThat(record.getAttempts()).isEqualTo(1);
        assertThat(record.getStatus()).isEqualTo(OtpStatus.ACTIVE);
        verify(flow, never()).applyPostVerification(any());
    }

    @Test
    void rejectsADestinationTheChannelCannotDeliverTo() {
        when(channelFactory.getChannel(OtpChannelType.EMAIL)).thenReturn(channel);
        when(channel.normalizeTarget("not-an-email")).thenReturn("not-an-email");
        doThrow(new IllegalArgumentException("Enter a valid email address."))
                .when(channel).validateTarget("not-an-email");

        assertThatThrownBy(() -> otpService.send(
                new SendOtpRequest("not-an-email", null, null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Enter a valid email address.");

        verify(otpRepository, never()).save(any(OtpVerification.class));
    }

    private void givenChannel(
            OtpChannelType type,
            String target,
            boolean providerManaged
    ) {
        when(channelFactory.getChannel(type)).thenReturn(channel);
        when(channel.getType()).thenReturn(type);
        when(channel.normalizeTarget(target)).thenReturn(target);
        when(channel.isProviderManaged()).thenReturn(providerManaged);
    }

    private void givenOwner(String target) {
        when(channel.findOwner(target)).thenReturn(Optional.of(user));
    }

    private void givenRegistrationFlow() {
        when(flowFactory.getFlow(OtpPurpose.REGISTRATION)).thenReturn(flow);
        when(flow.getPurpose()).thenReturn(OtpPurpose.REGISTRATION);
    }

    private void givenStoredRecord(
            String target,
            OtpChannelType type,
            OtpPurpose purpose,
            OtpVerification record
    ) {
        when(otpRepository
                .findTopByTargetAndChannelAndPurposeOrderByCreatedAtDesc(
                        target, type, purpose))
                .thenReturn(Optional.of(record));
    }

    private OtpVerification activeRecord(String target, OtpChannelType type) {
        OtpVerification record = new OtpVerification();
        record.setTarget(target);
        record.setChannel(type);
        record.setPurpose(OtpPurpose.REGISTRATION);
        record.setStatus(OtpStatus.ACTIVE);
        record.setAttempts(0);
        record.setExpiresAt(LocalDateTime.now().plusMinutes(EXPIRY_MINUTES));
        return record;
    }

    private OtpVerification capturedRecord() {
        ArgumentCaptor<OtpVerification> captor =
                ArgumentCaptor.forClass(OtpVerification.class);
        verify(otpRepository).save(captor.capture());
        return captor.getValue();
    }

    private OtpDispatchCommand capturedCommand() {
        ArgumentCaptor<OtpDispatchCommand> captor =
                ArgumentCaptor.forClass(OtpDispatchCommand.class);
        verify(channel).dispatch(captor.capture());
        return captor.getValue();
    }
}
