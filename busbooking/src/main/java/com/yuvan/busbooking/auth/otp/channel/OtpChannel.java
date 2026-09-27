package com.yuvan.busbooking.auth.otp.channel;

import com.yuvan.busbooking.user.entity.User;

import java.util.Optional;

/**
 * Strategy describing how an OTP reaches a target and how that target is
 * handled: which destinations are acceptable, what their canonical form is,
 * who owns them, how the code is delivered and how a submitted code is
 * checked.
 *
 * <p>This is the transport half of the OTP flow and is deliberately unaware of
 * <em>why</em> a code is issued — that is the job of
 * {@link com.yuvan.busbooking.auth.otp.flow.OtpFlow}. Splitting the two means a new
 * delivery method (WhatsApp, push, voice call, …) only requires a new
 * implementation of this interface.</p>
 *
 * <p>Implementations are Spring beans and are auto-registered by
 * {@link OtpChannelFactory} under their {@link #getType() type}.</p>
 */
public interface OtpChannel {

    /**
     * @return the delivery method this channel implements.
     */
    OtpChannelType getType();

    /**
     * @return a human readable name for the destination, e.g. {@code email}.
     */
    String label();

    /**
     * Converts a raw destination into the canonical form used for validation,
     * persistence and lookups (trimmed, lower-cased, digits-only, …).
     *
     * @param target the raw destination.
     * @return the canonical destination, or {@code null} when the input is
     * {@code null}.
     */
    String normalizeTarget(String target);

    /**
     * Rejects destinations this channel cannot deliver to.
     *
     * @param target the canonical destination.
     * @throws IllegalArgumentException if the destination is missing or
     *                                  malformed for this channel.
     */
    void validateTarget(String target);

    /**
     * Masks a destination so it is safe to log or return to the client.
     *
     * @param target the canonical destination.
     * @return a masked representation of the destination.
     */
    String maskTarget(String target);

    /**
     * Indicates whether the channel provider generates and validates the code
     * itself ({@code true}) or whether this application issues the code and
     * compares it against its own hash ({@code false}).
     *
     * <p>Provider-managed channels return a handle from
     * {@link #dispatch(OtpDispatchCommand)} and are asked to check the code in
     * {@link #confirmCode(String, String)}; the flow stores no code hash for
     * them.</p>
     */
    boolean isProviderManaged();

    /**
     * Hands the OTP to the underlying transport.
     *
     * @param command the destination, the code (locally issued channels only)
     *                and the expiry window.
     * @return the dispatch result, carrying a provider reference for
     * provider-managed channels.
     * @throws com.yuvan.busbooking.auth.otp.exception.OtpDeliveryException if
     *                                                                   delivery fails.
     */
    OtpDispatch dispatch(OtpDispatchCommand command);

    /**
     * Asks the provider whether the submitted code is valid. Only called for
     * channels reporting {@link #isProviderManaged()}.
     *
     * @param externalReference the handle returned by {@link #dispatch(OtpDispatchCommand)}.
     * @param submittedCode     the code entered by the user.
     * @throws com.yuvan.busbooking.common.exception.OtpVerificationException if
     *                                                                     the code is not valid.
     */
    void confirmCode(String externalReference, String submittedCode);

    /**
     * Resolves the account that owns the given destination.
     *
     * @param target the canonical destination.
     * @return the owning user, or {@code null} when no account uses this destination.
     */
    Optional<User> findOwner(String target);
}
