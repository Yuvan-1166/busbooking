package com.yuvan.busbooking.user.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.yuvan.busbooking.user.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    List<User> findByCreatedAtBetween(
            LocalDateTime from,
            LocalDateTime to);

    long countByCreatedAtBetween(
            LocalDateTime from,
            LocalDateTime to);
}