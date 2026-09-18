package com.yuvan.busbooking.auth.entity;

import com.yuvan.busbooking.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Stores the Twitter (X) OAuth 2.0 credential linked to a local user account.
 *
 * <p>The {@code twitterId} is Twitter's stable, immutable numeric identifier for the account.
 * It is used as the lookup key on every subsequent sign-in so that we never rely on the
 * username, which can be changed by the user at any time.</p>
 *
 * <p>We do <em>not</em> persist the access or refresh tokens here; they are only used
 * transiently during the callback to fetch the user's profile and are then discarded.</p>
 */
@Entity
@Table(name = "user_twitter_credentials")
@Getter
@Setter
public class UserTwitterCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Twitter's stable numeric user ID (e.g. "783214").
     * Immutable even when the user changes their handle.
     */
    @Column(name = "twitter_id", nullable = false, unique = true, length = 64)
    private String twitterId;

    /** The Twitter @handle at the time of last sign-in (informational, kept in sync). */
    @Column(name = "twitter_username", nullable = false, length = 64)
    private String twitterUsername;

    /** Display name as returned by the Twitter API (e.g. "Elon Musk"). */
    @Column(name = "display_name", length = 255)
    private String displayName;

    /** Profile image URL from Twitter (may change when user updates their avatar). */
    @Column(name = "profile_image_url", length = 512)
    private String profileImageUrl;

    /**
     * One-to-one mapping to the local user record.
     * A single Twitter account can be linked to exactly one local user.
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
