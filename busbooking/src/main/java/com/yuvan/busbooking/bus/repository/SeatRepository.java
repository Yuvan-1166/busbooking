package com.yuvan.busbooking.bus.repository;

import com.yuvan.busbooking.bus.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    boolean existsByBusIdAndSeatNumber(
            Long busId,
            String seatNumber
    );

    List<Seat> findByBusIdOrderBySeatNumber(Long busId);

    long countByBusIdIn(Collection<Long> busIds);
    
}