package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import com.yuvan.busbooking.user.entity.User;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * This flow replaced an endpoint that marked the number verified without ever
 * checking a code, so the flag is only ever set from a confirmed code.
 */
class MobileVerificationOtpFlowTest {

    private final MobileVerificationOtpFlow flow = new MobileVerificationOtpFlow();

    @Test
    void belongsToTheMobileVerificationPurpose() {
        assertThat(flow.getPurpose()).isEqualTo(OtpPurpose.MOBILE_VERIFICATION);
    }

    @Test
    void supportsTheMobileChannel() {
        assertThat(flow.supportsChannel(OtpChannelType.MOBILE)).isTrue();
    }

    /**
     * An email code proves nothing about a phone number, so this flow must not
     * be reachable over EMAIL.
     */
    @Test
    void refusesTheEmailChannel() {
        assertThat(flow.supportsChannel(OtpChannelType.EMAIL)).isFalse();
    }

    @Test
    void marksTheNumberVerifiedOnceTheCodeIsConfirmed() {
        User user = new User();
        user.setMobileVerified(false);

        flow.applyPostVerification(user);

        assertThat(user.getMobileVerified()).isTrue();
        assertThat(user.getMobileVerifiedAt()).isNotNull();
    }

    @Test
    void aCodeMayBeSentWhileTheNumberIsStillUnverified() {
        User user = new User();
        user.setMobileVerified(false);

        assertThatCode(() -> flow.validateForSend(user)).doesNotThrowAnyException();
    }

    @Test
    void refusesToSendACodeForAnAlreadyVerifiedNumber() {
        User user = new User();
        user.setMobileVerified(true);

        assertThatThrownBy(() -> flow.validateForSend(user))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Mobile number is already verified");
    }
}
