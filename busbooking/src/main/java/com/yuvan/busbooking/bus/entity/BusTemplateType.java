package com.yuvan.busbooking.bus.entity;

/**
 * Bus seat arrangements used in real-world intercity travel.
 *
 * <p>A template type describes the kind of arrangement, not a vehicle brand or
 * marketing class. The type name encodes the seat class (seater,
 * semi-sleeper, sleeper), the deck layout (single / double) and the per-row
 * seat distribution written as {@code left+right} (for example {@code 2+2}
 * means two seats on each side of the aisle).
 */
public enum BusTemplateType {

    // ---- Single deck ----

    SEATER_2_PLUS_2("Seater 2+2", "Two seats on each side of the aisle", DeckType.SINGLE),
    SEATER_1_PLUS_2("Seater 1+2", "One seat on the left, two on the right", DeckType.SINGLE),
    SEATER_2_PLUS_3("Seater 2+3", "Five seats per row for maximum capacity", DeckType.SINGLE),
    SEATER_1_PLUS_1("Seater 1+1", "Wide single seats on both sides of the aisle", DeckType.SINGLE),

    SEMI_SLEEPER_2_PLUS_2("Semi-Sleeper 2+2", "Reclining semi-sleeper seats in a 2+2 layout", DeckType.SINGLE),
    SEMI_SLEEPER_1_PLUS_2("Semi-Sleeper 1+2", "Reclining semi-sleeper seats in a 1+2 layout", DeckType.SINGLE),
    SEMI_SLEEPER_2_PLUS_3("Semi-Sleeper 2+3", "Reclining semi-sleeper seats in a 2+3 layout", DeckType.SINGLE),
    SEMI_SLEEPER_1_PLUS_1("Semi-Sleeper 1+1", "Spacious reclining semi-sleeper seats in a 1+1 layout", DeckType.SINGLE),

    SLEEPER_2_PLUS_1("Sleeper 2+1", "Stacked berths on one side, single berth on the other", DeckType.SINGLE),
    SLEEPER_1_PLUS_1("Sleeper 1+1", "Single berths on both sides of the aisle", DeckType.SINGLE),
    SLEEPER_2_PLUS_2("Sleeper 2+2", "Stacked berth pairs on both sides of the aisle", DeckType.SINGLE),

    // ---- Double deck ----

    DOUBLE_DECKER_SEATER_2_PLUS_2("Double Decker Seater 2+2", "2+2 seating on both levels", DeckType.DOUBLE),
    DOUBLE_DECKER_SEATER_2_PLUS_3("Double Decker Seater 2+3", "High-capacity 2+3 seating on both levels", DeckType.DOUBLE),
    DOUBLE_DECKER_SLEEPER_2_PLUS_1("Double Decker Sleeper 2+1", "Sleepers with a 2+1 berth arrangement on both levels", DeckType.DOUBLE),
    SLEEPER_CUM_SEATER_2_PLUS_1("Sleeper-Cum-Seater 2+1", "Sleepers on the upper deck, seater on the lower deck", DeckType.DOUBLE);

    private final String displayName;
    private final String description;
    private final DeckType deckType;

    BusTemplateType(String displayName, String description, DeckType deckType) {
        this.displayName = displayName;
        this.description = description;
        this.deckType = deckType;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public DeckType getDeckType() {
        return deckType;
    }
}