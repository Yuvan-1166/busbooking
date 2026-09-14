package com.yuvan.busbooking.route.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.yuvan.busbooking.route.entity.Route;

public interface RouteRepository extends JpaRepository<Route, Long> {

}