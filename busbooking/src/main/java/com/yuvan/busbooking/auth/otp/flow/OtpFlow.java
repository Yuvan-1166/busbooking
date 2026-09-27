package com.yuvan.busbooking.auth.otp.flow;

import com.yuvan.busbooking.auth.entity.OtpPurpose;
import com.yuvan.busbooking.user.entity.User;

/**
 * Strategy describing the lifecycle of OTPs issued for a given
 * {@link OtpPurpose}.
 * <p>Each implementation defines the purpose-specific behavior: preconditions
 * for issuing a new OTP and any side effects to apply once a submitted code
 * verifies successfully. Delivery is not its concern — that belongs to the
 * channel, so a purpose works the same over email, SMS or any future
 * transport.</p>
 */
public interface OtpFlow {

    /**
     * @return the purpose this flow handles.
     */
    OtpPurpose getPurpose();

    /**
     * Validates that a new OTP may be issued for this user.
     *
     * @param user the user requesting an OTP.
     * @throws IllegalStateException if the user is not eligible to receive an OTP.
     */
    void validateForSend(User user);

    /**
     * Applies purpose-specific side effects after a successful verification.
     * <p>Persistence of the supplied user is handled by the caller.</p>
     *
     * @param user the verified user.
     */
    void applyPostVerification(User user);
}
