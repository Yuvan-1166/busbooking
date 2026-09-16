package com.yuvan.busbooking.auth.repository;

import com.yuvan.busbooking.auth.entity.TotpVerificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TotpVerificationLogRepository extends JpaRepository<TotpVerificationLog, Long> {

    /**
     * Count failed TOTP verification attempts for a user within a time window
     */
    @Query("SELECT COUNT(t) FROM TotpVerificationLog t WHERE t.user.id = :userId " +
           "AND t.success = false AND t.attemptedAt >= :since")
    long countFailedAttemptsSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    /**
     * Get recent verification attempts for a user
     */
    List<TotpVerificationLog> findTop10ByUserIdOrderByAttemptedAtDesc(Long userId);
}
