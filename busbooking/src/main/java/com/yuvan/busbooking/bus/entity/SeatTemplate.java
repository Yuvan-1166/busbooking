package com.yuvan.busbooking.bus.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents a pre-built seat arrangement template that operators can use
 * to quickly configure buses without manually creating each seat.
 */
@Entity
@Table(name = "seat_templates")
@Getter
@Setter
public class SeatTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type", nullable = false, length = 50)
    private BusTemplateType templateType;

    @Enumerated(EnumType.STRING)
    @Column(name = "deck_type", nullable = false, length = 20)
    private DeckType deckType;

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;

    @Column(length = 500)
    private String description;

    /**
     * JSON configuration containing the deck layouts. Each deck is described
     * as a fixed row recipe (seats on each side of the aisle and the seat
     * class), so the same arrangement can be applied with any number of rows.
     * Structure:
     * {
     *   "decks": [
     *     {
     *       "deckNumber": 1,
     *       "deckName": "Lower Deck",
     *       "rows": 10,
     *       "leftSeats": 2,
     *       "rightSeats": 2,
     *       "seatType": "SEAT"
     *     }
     *   ]
     * }
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "json")
    private TemplateConfiguration configuration;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Configuration structure for seat template
     */
    public static class TemplateConfiguration {
        @JsonProperty("decks")
        private List<DeckConfiguration> decks;

        public TemplateConfiguration() {
        }

        public TemplateConfiguration(List<DeckConfiguration> decks) {
            this.decks = decks;
        }

        public List<DeckConfiguration> getDecks() {
            return decks;
        }

        public void setDecks(List<DeckConfiguration> decks) {
            this.decks = decks;
        }
    }

    /**
     * Configuration for a single deck (lower or upper).
     * The layout is fixed by the seat distribution around the aisle; only the
     * number of rows can vary between deployments of the same template.
     */
    public static class DeckConfiguration {
        @JsonProperty("deckNumber")
        private Integer deckNumber;

        @JsonProperty("deckName")
        private String deckName;

        @JsonProperty("rows")
        private Integer rows;

        @JsonProperty("leftSeats")
        private Integer leftSeats;

        @JsonProperty("rightSeats")
        private Integer rightSeats;

        @JsonProperty("seatType")
        private SeatType seatType;

        public DeckConfiguration() {
        }

        public DeckConfiguration(Integer deckNumber, String deckName, Integer rows, Integer leftSeats, Integer rightSeats, SeatType seatType) {
            this.deckNumber = deckNumber;
            this.deckName = deckName;
            this.rows = rows;
            this.leftSeats = leftSeats;
            this.rightSeats = rightSeats;
            this.seatType = seatType;
        }

        public Integer getDeckNumber() {
            return deckNumber;
        }

        public void setDeckNumber(Integer deckNumber) {
            this.deckNumber = deckNumber;
        }

        public String getDeckName() {
            return deckName;
        }

        public void setDeckName(String deckName) {
            this.deckName = deckName;
        }

        public Integer getRows() {
            return rows;
        }

        public void setRows(Integer rows) {
            this.rows = rows;
        }

        public Integer getLeftSeats() {
            return leftSeats;
        }

        public void setLeftSeats(Integer leftSeats) {
            this.leftSeats = leftSeats;
        }

        public Integer getRightSeats() {
            return rightSeats;
        }

        public void setRightSeats(Integer rightSeats) {
            this.rightSeats = rightSeats;
        }

        public SeatType getSeatType() {
            return seatType;
        }

        public void setSeatType(SeatType seatType) {
            this.seatType = seatType;
        }
    }
}
