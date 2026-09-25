package com.yuvan.busbooking.notification.entity;

import com.yuvan.busbooking.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Audit trail for every report delivery attempt.
 *
 * <p>Failures are recorded with a sanitised error message so operators can
 * inspect delivery health without leaking SMTP internals.</p>
 */
@Entity
@Table(
        name = "report_delivery_logs",
        indexes = {
                @Index(name = "idx_report_log_user", columnList = "user_id"),
                @Index(name = "idx_report_log_sent_at", columnList = "sent_at")
        }
)
@Getter
@Setter
public class ReportDeliveryLog {

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

    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReportDeliveryStatus status;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
    }
}