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
     * JSON configuration containing the deck layouts.
     * Structure:
     * {
     *   "decks": [
     *     {
     *       "deckNumber": 1,
     *       "deckName": "Lower",
     *       "rows": 10,
     *       "columns": 4,
     *       "aisleAfter": 2,
     *       "seatPattern": [
     *         {"row": 1, "col": 1, "seatNumber": "L1", "type": "SEAT", "position": "WINDOW", "genderPolicy": "ANY"},
     *         ...
     *       ]
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
     * Configuration for a single deck (lower or upper)
     */
    public static class DeckConfiguration {
        @JsonProperty("deckNumber")
        private Integer deckNumber;

        @JsonProperty("deckName")
        private String deckName;

        @JsonProperty("rows")
        private Integer rows;

        @JsonProperty("columns")
        private Integer columns;

        @JsonProperty("aisleAfter")
        private Integer aisleAfter;

        @JsonProperty("seatPattern")
        private List<SeatPattern> seatPattern;

        public DeckConfiguration() {
        }

        public DeckConfiguration(Integer deckNumber, String deckName, Integer rows, Integer columns, Integer aisleAfter, List<SeatPattern> seatPattern) {
            this.deckNumber = deckNumber;
            this.deckName = deckName;
            this.rows = rows;
            this.columns = columns;
            this.aisleAfter = aisleAfter;
            this.seatPattern = seatPattern;
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

        public Integer getColumns() {
            return columns;
        }

        public void setColumns(Integer columns) {
            this.columns = columns;
        }

        public Integer getAisleAfter() {
            return aisleAfter;
        }

        public void setAisleAfter(Integer aisleAfter) {
            this.aisleAfter = aisleAfter;
        }

        public List<SeatPattern> getSeatPattern() {
            return seatPattern;
        }

        public void setSeatPattern(List<SeatPattern> seatPattern) {
            this.seatPattern = seatPattern;
        }
    }

    /**
     * Individual seat configuration in the pattern
     */
    public static class SeatPattern {
        @JsonProperty("row")
        private Integer row;

        @JsonProperty("col")
        private Integer col;

        @JsonProperty("seatNumber")
        private String seatNumber;

        @JsonProperty("type")
        private SeatType type;

        @JsonProperty("position")
        private SeatPosition position;

        @JsonProperty("genderPolicy")
        private SeatGenderPolicy genderPolicy;

        public SeatPattern() {
        }

        public SeatPattern(Integer row, Integer col, String seatNumber, SeatType type, SeatPosition position, SeatGenderPolicy genderPolicy) {
            this.row = row;
            this.col = col;
            this.seatNumber = seatNumber;
            this.type = type;
            this.position = position;
            this.genderPolicy = genderPolicy;
        }

        public Integer getRow() {
            return row;
        }

        public void setRow(Integer row) {
            this.row = row;
        }

        public Integer getCol() {
            return col;
        }

        public void setCol(Integer col) {
            this.col = col;
        }

        public String getSeatNumber() {
            return seatNumber;
        }

        public void setSeatNumber(String seatNumber) {
            this.seatNumber = seatNumber;
        }

        public SeatType getType() {
            return type;
        }

        public void setType(SeatType type) {
            this.type = type;
        }

        public SeatPosition getPosition() {
            return position;
        }

        public void setPosition(SeatPosition position) {
            this.position = position;
        }

        public SeatGenderPolicy getGenderPolicy() {
            return genderPolicy;
        }

        public void setGenderPolicy(SeatGenderPolicy genderPolicy) {
            this.genderPolicy = genderPolicy;
        }
    }
}
