package com.yuvan.busbooking.user.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.yuvan.busbooking.user.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    /**
     * Looks a user up by the last digits of their phone number, so numbers
     * stored with or without a country code both match the same 10-digit
     * national number.
     */
    Optional<User> findFirstByPhoneEndingWithOrderByIdAsc(String phoneDigits);

    List<User> findByCreatedAtBetween(
            LocalDateTime from,
            LocalDateTime to);

    long countByCreatedAtBetween(
            LocalDateTime from,
            LocalDateTime to);
}
