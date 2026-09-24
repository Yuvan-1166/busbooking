package com.yuvan.busbooking.operator.repository;

import com.yuvan.busbooking.operator.entity.Operator;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OperatorRepository extends JpaRepository<Operator, Long> {

    Optional<Operator> findByUserId(Long userId);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByUserId(Long userId);

    long countByCreatedAtBetween(
            LocalDateTime from,
            LocalDateTime to);
}