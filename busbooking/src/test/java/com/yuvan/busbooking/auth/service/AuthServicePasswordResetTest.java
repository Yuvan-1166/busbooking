package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannel;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelFactory;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import com.yuvan.busbooking.auth.otp.dto.ForgotPasswordRequest;
import com.yuvan.busbooking.auth.otp.dto.ResetPasswordRequest;
import com.yuvan.busbooking.auth.otp.dto.SendOtpRequest;
import com.yuvan.busbooking.auth.otp.dto.VerifyOtpRequest;
import com.yuvan.busbooking.auth.otp.service.OtpService;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Password reset goes through the same OTP flow as every other code, so the
 * only thing the channel decides is which destination is read and which account
 * the password is applied to.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServicePasswordResetTest {

    private static final String EMAIL = "rider@example.com";
    private static final String MOBILE = "9876543210";
    private static final String FORMATTED_MOBILE = "+91 98765-43210";

    @Mock
    private UserRepository userRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private OtpChannelFactory otpChannelFactory;

    @Mock
    private OtpChannel channel;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private User user;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                null,
                null,
                otpService,
                otpChannelFactory,
                passwordEncoder,
                null,
                null
        );
    }

    @Test
    void forgotPasswordNormalisesTheMobileNumberAndAsksForTheChannel() {
        givenChannel(OtpChannelType.MOBILE, FORMATTED_MOBILE, MOBILE);

        var response = authService.forgotPassword(
                new ForgotPasswordRequest(FORMATTED_MOBILE, OtpChannelType.MOBILE));

        verify(otpService).send(new SendOtpRequest(
                MOBILE, OtpChannelType.MOBILE, OtpPurpose.PASSWORD_RESET));
        assertThat(response.message()).contains("reset code has been sent");
    }

    @Test
    void forgotPasswordStaysSilentWhenTheDestinationIsUnknown() {
        givenChannel(OtpChannelType.MOBILE, FORMATTED_MOBILE, MOBILE);
        doThrow(new IllegalArgumentException("No account found"))
                .when(otpService).send(any(SendOtpRequest.class));

        assertThatCode(() -> authService.forgotPassword(
                new ForgotPasswordRequest(FORMATTED_MOBILE, OtpChannelType.MOBILE)))
                .doesNotThrowAnyException();
    }

    @Test
    void resetPasswordConfirmsOnTheChannelAndUpdatesTheResolvedAccount() {
        givenChannel(OtpChannelType.MOBILE, FORMATTED_MOBILE, MOBILE);
        when(channel.findOwner(MOBILE)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("new-secret-1", user.getPasswordHash()))
                .thenReturn(false);
        when(passwordEncoder.encode("new-secret-1")).thenReturn("new-hash");

        var response = authService.resetPassword(new ResetPasswordRequest(
                FORMATTED_MOBILE, "123456", "new-secret-1", OtpChannelType.MOBILE));

        verify(otpService).confirm(new VerifyOtpRequest(
                MOBILE, "123456", OtpChannelType.MOBILE, OtpPurpose.PASSWORD_RESET));
        verify(user).setPasswordHash("new-hash");
        verify(userRepository).save(user);
        assertThat(response.message()).contains("successfully");
    }

    @Test
    void emailClientsKeepWorkingWithoutNamingAChannel() {
        when(otpChannelFactory.getChannel(OtpChannelType.EMAIL)).thenReturn(channel);
        when(channel.normalizeTarget(EMAIL)).thenReturn(EMAIL);
        when(channel.getType()).thenReturn(OtpChannelType.EMAIL);
        when(channel.findOwner(EMAIL)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-secret-1")).thenReturn("new-hash");

        authService.forgotPassword(new ForgotPasswordRequest(EMAIL, null));
        authService.resetPassword(
                new ResetPasswordRequest(EMAIL, "123456", "new-secret-1", null));

        verify(otpService).send(new SendOtpRequest(
                EMAIL, OtpChannelType.EMAIL, OtpPurpose.PASSWORD_RESET));
        verify(otpService).confirm(new VerifyOtpRequest(
                EMAIL, "123456", OtpChannelType.EMAIL, OtpPurpose.PASSWORD_RESET));
    }

    @Test
    void resetPasswordNeverTouchesTheAccountWhenTheCodeIsRejected() {
        givenChannel(OtpChannelType.MOBILE, FORMATTED_MOBILE, MOBILE);
        doThrow(new IllegalArgumentException("Incorrect code. 4 attempts remaining."))
                .when(otpService).confirm(any(VerifyOtpRequest.class));

        assertThatCode(() -> authService.resetPassword(new ResetPasswordRequest(
                FORMATTED_MOBILE, "000000", "new-secret-1", OtpChannelType.MOBILE)))
                .isInstanceOf(IllegalArgumentException.class);

        verify(userRepository, never()).save(any(User.class));
    }

    private void givenChannel(OtpChannelType type, String input, String normalised) {
        when(otpChannelFactory.getChannel(type)).thenReturn(channel);
        when(channel.normalizeTarget(input)).thenReturn(normalised);
        when(channel.getType()).thenReturn(type);
    }
}
