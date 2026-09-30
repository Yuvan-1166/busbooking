package com.yuvan.busbooking.auth.otp.channel;

import com.yuvan.busbooking.user.entity.User;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OtpChannelFactoryTest {

    private final OtpChannel emailChannel = stub(OtpChannelType.EMAIL);
    private final OtpChannel mobileChannel = stub(OtpChannelType.MOBILE);

    @Test
    void resolvesRegisteredChannelsByType() {
        OtpChannelFactory factory =
                new OtpChannelFactory(List.of(emailChannel, mobileChannel));

        assertThat(factory.getChannel(OtpChannelType.EMAIL)).isSameAs(emailChannel);
        assertThat(factory.getChannel(OtpChannelType.MOBILE)).isSameAs(mobileChannel);
    }

    @Test
    void throwsForUnsupportedChannel() {
        OtpChannelFactory factory =
                new OtpChannelFactory(List.of(emailChannel));

        assertThatThrownBy(() -> factory.getChannel(OtpChannelType.MOBILE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Unsupported OTP channel: MOBILE");
    }

    @Test
    void rejectsDuplicatedChannelRegistrations() {
        assertThatThrownBy(() -> new OtpChannelFactory(
                List.of(emailChannel, stub(OtpChannelType.EMAIL))))
                .isInstanceOf(IllegalStateException.class);
    }

    private OtpChannel stub(OtpChannelType type) {
        return new OtpChannel() {
            @Override
            public OtpChannelType getType() {
                return type;
            }

            @Override
            public String label() {
                return type.name().toLowerCase();
            }

            @Override
            public String normalizeTarget(String target) {
                return target;
            }

            @Override
            public void validateTarget(String target) {
            }

            @Override
            public String maskTarget(String target) {
                return target;
            }

            @Override
            public boolean isProviderManaged() {
                return false;
            }

            @Override
            public OtpDispatch dispatch(OtpDispatchCommand command) {
                return OtpDispatch.local();
            }

            @Override
            public boolean confirmCode(String externalReference, String submittedCode) {
                return true;
            }

            @Override
            public Optional<User> findOwner(String target) {
                return Optional.empty();
            }
        };
    }
}
