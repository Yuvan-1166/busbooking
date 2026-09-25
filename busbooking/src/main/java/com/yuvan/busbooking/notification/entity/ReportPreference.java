package com.yuvan.busbooking.notification.entity;

import com.yuvan.busbooking.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A user's opt-in subscription for a recurring emailed report.
 *
 * <p>The {@code next_run_at} column gates delivery: the scheduler queries
 * only rows where {@code active = true} and the timestamp is in the past,
 * backed by a composite index, making each scan O(due rows). Deliveries
 * advance {@code next_run_at} by the subscription's frequency; failures
 * push it forward by a short retry delay.</p>
 */
@Entity
@Table(
        name = "report_preferences",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_report_pref_user_type",
                        columnNames = {"user_id", "report_type"}
                )
        },
        indexes = {
                @Index(name = "idx_report_pref_due", columnList = "active,next_run_at")
        }
)
@Getter
@Setter
public class ReportPreference {

    public static final long RETRY_DELAY_MINUTES = 30;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 40)
    private ReportType reportType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportFrequency frequency;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "next_run_at", nullable = false)
    private LocalDateTime nextRunAt;

    @Column(name = "last_sent_at")
    private LocalDateTime lastSentAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (active == null) {
            active = true;
        }
        if (nextRunAt == null) {
            nextRunAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Records a successful delivery and schedules the following run.
     */
    public void markDelivered(LocalDateTime deliveredAt) {
        lastSentAt = deliveredAt;
        nextRunAt = frequency.nextRunAt(deliveredAt);
    }

    /**
     * Defers the next attempt after a failed delivery.
     */
    public void scheduleRetry(LocalDateTime failedAt) {
        nextRunAt = failedAt.plusMinutes(RETRY_DELAY_MINUTES);
    }
}