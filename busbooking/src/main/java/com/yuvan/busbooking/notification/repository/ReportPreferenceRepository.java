package com.yuvan.busbooking.notification.repository;

import com.yuvan.busbooking.notification.entity.ReportPreference;
import com.yuvan.busbooking.notification.entity.ReportType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReportPreferenceRepository extends JpaRepository<ReportPreference, Long> {

    List<ReportPreference> findByUserId(Long userId);

    Optional<ReportPreference> findByUserIdAndReportType(
            Long userId,
            ReportType reportType);

    boolean existsByUserIdAndReportType(Long userId, ReportType reportType);

    /**
     * Selects active subscriptions whose next run is due, locking the rows
     * so concurrent application instances cannot double-deliver. The lock is
     * held until the surrounding transaction commits, at which point the
     * refreshed {@code next_run_at} values prevent re-selection.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p FROM ReportPreference p
            WHERE p.active = true AND p.nextRunAt <= :now
            ORDER BY p.nextRunAt
            """)
    List<ReportPreference> findDueForUpdate(@Param("now") LocalDateTime now);
}