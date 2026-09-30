package com.yuvan.busbooking.auth.otp.channel;

import com.yuvan.busbooking.user.entity.User;

import java.util.Optional;

public interface OtpChannel {

    OtpChannelType getType();

    String label();

    String normalizeTarget(String target);

    void validateTarget(String target);

    String maskTarget(String target);

    boolean isProviderManaged();

    OtpDispatch dispatch(OtpDispatchCommand command);

    boolean confirmCode(String externalReference, String submittedCode);

    Optional<User> findOwner(String target);
}
