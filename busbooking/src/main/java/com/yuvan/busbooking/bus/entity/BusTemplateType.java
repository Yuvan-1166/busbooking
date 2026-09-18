package com.yuvan.busbooking.bus.entity;

/**
 * Represents common bus seating configurations used in modern intercity travel.
 * Each template type defines a standard layout pattern that operators can use.
 */
public enum BusTemplateType {
    // Single Deck Seaters
    AC_SEATER_2X2("AC Seater (2+2)", "Standard AC seater with 2 seats on each side", DeckType.SINGLE),
    AC_SEATER_2X3("AC Seater (2+3)", "Economy AC seater with 5 seats per row", DeckType.SINGLE),
    SEMI_SLEEPER_2X2("AC Semi-Sleeper (2+2)", "Reclining seats with extra legroom", DeckType.SINGLE),
    VOLVO_MULTI_AXLE("Volvo Multi-Axle (2+2)", "Premium multi-axle bus with spacious seating", DeckType.SINGLE),
    
    // Single Deck Sleepers
    SLEEPER_2X1("AC Sleeper (2+1)", "Overnight sleeper with berths arranged 2+1", DeckType.SINGLE),
    
    // Double Deck Seaters
    DOUBLE_DECKER_SEATER("Double Decker Seater (2+2)", "Two-level seater bus with 2+2 on both decks", DeckType.DOUBLE),
    
    // Double Deck Sleepers
    DOUBLE_DECKER_SLEEPER("Double Decker Sleeper (2+1)", "Two-level sleeper with berths on both decks", DeckType.DOUBLE),
    
    // Mini Buses
    MINI_BUS_2X1("Mini Bus (2+1)", "Compact bus for short routes with 2+1 configuration", DeckType.SINGLE),
    
    // Luxury Coaches
    LUXURY_COACH_1X2("Luxury Coach (1+2)", "Premium coach with spacious 1+2 configuration", DeckType.SINGLE);

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
