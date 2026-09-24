package com.yuvan.busbooking.trip.repository;

import com.yuvan.busbooking.trip.entity.Trip;
import com.yuvan.busbooking.trip.entity.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {

    boolean existsByScheduleIdAndTripDate(
            Long scheduleId,
            LocalDate tripDate
    );

    @Query("""
                SELECT t
                FROM Trip t
                WHERE t.route.id = :routeId
                  AND t.tripDate = :tripDate
                  AND t.status IN :activeStatuses
                  AND t.expiresAt > :now
            """)
    List<Trip> findUpcomingByRouteIdAndTripDate(
            @Param("routeId") Long routeId,
            @Param("tripDate") LocalDate tripDate,
            @Param("activeStatuses") List<TripStatus> activeStatuses,
            @Param("now") LocalDateTime now);

    List<Trip> findByBusId(Long busId);

    List<Trip> findByBusOperatorUserId(Long userId);

    @Query("""
                SELECT t
                FROM Trip t
                WHERE t.status IN :statuses
                  AND t.expiresAt IS NOT NULL
                  AND t.expiresAt <= :now
            """)
    List<Trip> findTripsToExpire(
            @Param("statuses") List<TripStatus> statuses,
            @Param("now") LocalDateTime now);

    @Query("""
                SELECT t
                FROM Trip t
                WHERE t.status IN :statuses
                  AND t.expiresAt IS NULL
            """)
    List<Trip> findActiveTripsWithoutExpiration(
            @Param("statuses") List<TripStatus> statuses);

    @Query("""
                SELECT t
                FROM Trip t
                WHERE t.tripDate BETWEEN :from AND :to
                ORDER BY t.tripDate
            """)
    List<Trip> findForAnalytics(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("""
                SELECT t
                FROM Trip t
                WHERE t.tripDate BETWEEN :from AND :to
                  AND t.bus.operator.id = :operatorId
                ORDER BY t.tripDate
            """)
    List<Trip> findForAnalyticsByOperator(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("operatorId") Long operatorId);
}