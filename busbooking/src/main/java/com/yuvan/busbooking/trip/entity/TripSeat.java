package com.yuvan.busbooking.trip.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "trip_seats",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_trip_seats_trip_seat",
            columnNames = {"trip_id", "seat_id"}
        )
    }
)
@Getter
@Setter
public class TripSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seat_id", nullable = false)
    private com.yuvan.busbooking.bus.entity.Seat seat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripSeatStatus status;

    @Column(name = "held_until")
    private LocalDateTime heldUntil;

    @Version
    private Long version;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = TripSeatStatus.AVAILABLE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
}