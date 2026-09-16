package com.yuvan.busbooking.auth.repository;

import com.yuvan.busbooking.auth.entity.BackupCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BackupCodeRepository extends JpaRepository<BackupCode, Long> {

    /**
     * Find backup codes for a specific user
     */
    Optional<BackupCode> findByUserId(Long userId);

    /**
     * Delete backup codes for a user (when regenerating)
     */
    void deleteByUserId(Long userId);

    /**
     * Check if user has backup codes
     */
    boolean existsByUserId(Long userId);
}
