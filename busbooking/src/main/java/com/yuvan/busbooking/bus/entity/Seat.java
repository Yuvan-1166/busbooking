package com.yuvan.busbooking.bus.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "seats",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_seats_bus_number",
                        columnNames = {"bus_id", "seat_number"}
                )
        }
)
@Getter
@Setter
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @Column(name = "seat_number", nullable = false, length = 20)
    private String seatNumber;

    @Column(name = "deck_number")
    private Integer deckNumber;

    @Column(name = "deck_name", length = 50)
    private String deckName;

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_type", nullable = false, length = 20)
    private SeatType seatType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeatPosition position;

    /**
     * Column after which the aisle is placed in this row.
     * Seats in columns {@code <= aisleAfter} sit left of the aisle,
     * seats in columns {@code > aisleAfter} sit right of the aisle.
     */
    @Column(name = "aisle_after")
    private Integer aisleAfter;

    @Column(name = "gender_policy")
    private SeatGenderPolicy genderPolicy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
}