package com.yuvan.busbooking.auth.entity;

import com.yuvan.busbooking.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_google_credentials")
@Getter
@Setter
public class UserGoogleCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Google's stable subject identifier ("sub") – immutable, unique per user. */
    @Column(name = "google_sub", nullable = false, unique = true, length = 128)
    private String googleSub;

    /** The email as reported by Google – kept in sync on each sign-in. */
    @Column(name = "google_email", nullable = false, length = 255)
    private String googleEmail;

    @Column(name = "display_name", length = 255)
    private String displayName;

    @Column(name = "picture_url", length = 512)
    private String pictureUrl;

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
