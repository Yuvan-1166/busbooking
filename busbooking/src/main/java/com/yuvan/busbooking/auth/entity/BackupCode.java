package com.yuvan.busbooking.auth.entity;

import com.yuvan.busbooking.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "backup_codes")
@Getter
@Setter
public class BackupCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "codes_hash", nullable = false, columnDefinition = "TEXT")
    private String codesHash;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
        if (usedCount == null) {
            usedCount = 0;
        }
    }
}
