package com.yuvan.busbooking.auth.repository;

import com.yuvan.busbooking.auth.entity.OtpStatus;
import com.yuvan.busbooking.auth.entity.TotpAlternativeOtp;
import com.yuvan.busbooking.auth.entity.TotpAlternativeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TotpAlternativeOtpRepository extends JpaRepository<TotpAlternativeOtp, Long> {
    
    Optional<TotpAlternativeOtp> findById(Long id);
    
    Optional<TotpAlternativeOtp> findByIdAndStatusIn(Long id, List<OtpStatus> statuses);
    
    Optional<TotpAlternativeOtp> findByVerificationId(String verificationId);
    
    @Query("SELECT otp FROM TotpAlternativeOtp otp WHERE otp.user.id = :userId AND otp.method = :method AND otp.createdAt > :since")
    List<TotpAlternativeOtp> findRecentOtpAttempts(
        @Param("userId") Long userId,
        @Param("method") TotpAlternativeType method,
        @Param("since") LocalDateTime since
    );
    
    @Query("SELECT COUNT(otp) FROM TotpAlternativeOtp otp WHERE otp.user.id = :userId AND otp.status = 'FAILED' AND otp.createdAt > :since")
    long countFailedAttemptsSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);
}
