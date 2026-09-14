package com.yuvan.busbooking.bus.repository;

import com.yuvan.busbooking.bus.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusRepository extends JpaRepository<Bus, Long> {

    boolean existsByRegistrationNumber(String registrationNumber);

    List<Bus> findByOperatorId(Long operatorId);
}