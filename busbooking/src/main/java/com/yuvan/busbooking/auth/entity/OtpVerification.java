package com.yuvan.busbooking.auth.entity;

import com.yuvan.busbooking.auth.otp.channel.OtpChannelType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "otp_verifications",
    indexes = {
        @Index(
            name = "idx_otp_email_purpose",
            columnList = "email, purpose"
        )
    }
)
@Getter
@Setter
@ToString
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Channel-agnostic destination the code was sent to: an email address for
     * {@link OtpChannelType#EMAIL}, a mobile number for
     * {@link OtpChannelType#MOBILE}.
     * <p>Still mapped to the legacy {@code email} column so databases that have
     * not run {@code V7__make_otp_verifications_channel_aware.sql} keep
     * working; the column name is historical only.</p>
     */
    @Column(name = "email", nullable = false, length = 255)
    private String target;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private OtpChannelType channel;

    /**
     * BCrypt hash of the code. {@code null} for provider-managed channels,
     * which issue and validate the code themselves.
     */
    @Column(length = 255)
    private String otpHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OtpPurpose purpose;

    /**
     * Provider-side handle used to validate the code, set only for
     * provider-managed channels.
     */
    @Column(name = "external_reference", length = 100)
    private String externalReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OtpStatus status;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private LocalDateTime verifiedAt;

    @Column(nullable = false)
    private int attempts;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();

        if (attempts < 0) {
            attempts = 0;
        }

        if (status == null) {
            status = OtpStatus.ACTIVE;
        }

        if (channel == null) {
            channel = OtpChannelType.EMAIL;
        }
    }
}
