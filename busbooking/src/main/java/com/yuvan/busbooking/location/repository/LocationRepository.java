package com.yuvan.busbooking.location.repository;

import com.yuvan.busbooking.location.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<Location, Long> {
}