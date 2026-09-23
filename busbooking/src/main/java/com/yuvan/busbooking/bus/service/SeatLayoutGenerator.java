package com.yuvan.busbooking.bus.service;

import com.yuvan.busbooking.bus.entity.SeatGenderPolicy;
import com.yuvan.busbooking.bus.entity.SeatPosition;
import com.yuvan.busbooking.bus.entity.SeatTemplate;
import com.yuvan.busbooking.bus.entity.SeatType;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Expands a {@link SeatTemplate} configuration into concrete seats.
 *
 * <p>A deck is described as a fixed row recipe: how many seats sit on each
 * side of the aisle and what seat class they are. The generator applies that
 * recipe once per row, producing consistent seat numbers, window/aisle/middle
 * positions and a female-preferred policy for the front rows of the lower
 * deck. The number of rows follows the template default unless an override is
 * supplied.
 */
@Component
public class SeatLayoutGenerator {

    /**
     * Rows at the front of the lower/single deck that get a
     * female-preferred reservation, matching common operator practice.
     */
    public static final int GENDER_RESERVED_ROWS = 2;

    private static final String LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /** A fully-described seat produced from a deck recipe. */
    public record GeneratedSeat(
            String seatNumber,
            Integer deckNumber,
            String deckName,
            SeatType seatType,
            SeatPosition position,
            Integer aisleAfter,
            SeatGenderPolicy genderPolicy
    ) {
    }

    /**
     * Generate every seat in a template.
     *
     * @param template     the template whose configuration is expanded
     * @param rowsOverride optional per-deck row counts, in the same order as
     *                     the template decks; {@code null} or empty uses the
     *                     template defaults
     */
    public List<GeneratedSeat> generate(SeatTemplate template, List<Integer> rowsOverride) {
        SeatTemplate.TemplateConfiguration config = template.getConfiguration();
        if (config == null || config.getDecks() == null || config.getDecks().isEmpty()) {
            throw new IllegalArgumentException(
                    "Template \"" + template.getName() + "\" has no deck configuration");
        }

        List<SeatTemplate.DeckConfiguration> decks = config.getDecks();
        List<Integer> rows = resolveRows(decks, rowsOverride);

        boolean doubleDecker = decks.size() > 1;
        List<GeneratedSeat> seats = new ArrayList<>();

        for (int i = 0; i < decks.size(); i++) {
            seats.addAll(generateDeck(decks.get(i), rows.get(i), doubleDecker));
        }
        return seats;
    }

    /**
     * Total seats a template produces with its default row count - the
     * canonical capacity shown on the template.
     */
    public int totalSeats(SeatTemplate template) {
        SeatTemplate.TemplateConfiguration config = template.getConfiguration();
        if (config == null || config.getDecks() == null) {
            return 0;
        }
        return config.getDecks().stream()
                .mapToInt(deck -> deckSeats(deck, deck.getRows()))
                .sum();
    }

    /** Seats produced by a single deck recipe with a given row count. */
    public int deckSeats(SeatTemplate.DeckConfiguration deck, int rows) {
        return rows * (deck.getLeftSeats() + deck.getRightSeats());
    }

    private List<Integer> resolveRows(List<SeatTemplate.DeckConfiguration> decks, List<Integer> override) {
        if (override == null || override.isEmpty()) {
            return decks.stream()
                    .map(SeatTemplate.DeckConfiguration::getRows)
                    .map(rows -> {
                        if (rows == null || rows < 1) {
                            throw new IllegalArgumentException("A deck must have at least one row");
                        }
                        return rows;
                    })
                    .toList();
        }
        if (override.size() != decks.size()) {
            throw new IllegalArgumentException(
                    "Row override count (" + override.size() + ") does not match deck count ("
                            + decks.size() + ")");
        }
        return override.stream()
                .map(rows -> {
                    if (rows == null || rows < 1) {
                        throw new IllegalArgumentException("Row count must be at least 1");
                    }
                    return rows;
                })
                .toList();
    }

    private List<GeneratedSeat> generateDeck(SeatTemplate.DeckConfiguration deck, int rows, boolean doubleDecker) {
        int leftSeats = requirePositive(deck.getLeftSeats(), "leftSeats");
        int rightSeats = requirePositive(deck.getRightSeats(), "rightSeats");
        SeatType seatType = deck.getSeatType() == null ? SeatType.SEAT : deck.getSeatType();
        int columns = leftSeats + rightSeats;
        int aisleAfter = leftSeats;

        String prefix = doubleDecker ? (isLowerDeck(deck) ? "L" : "U") : "";
        List<String> cellLabels = rowLabels(deck);
        boolean reserveFrontRows = isLowerDeck(deck);

        List<GeneratedSeat> seats = new ArrayList<>();
        for (int row = 1; row <= rows; row++) {
            int column = 0;
            for (String label : cellLabels) {
                column++;
                SeatGenderPolicy genderPolicy =
                        reserveFrontRows && row <= GENDER_RESERVED_ROWS
                                ? SeatGenderPolicy.FEMALE_PREFERRED
                                : SeatGenderPolicy.ANY;

                seats.add(new GeneratedSeat(
                        prefix + row + label,
                        deck.getDeckNumber(),
                        deck.getDeckName(),
                        seatType,
                        positionFor(column, columns, leftSeats),
                        aisleAfter,
                        genderPolicy
                ));
            }
        }
        return seats;
    }

    /**
     * Per-row cell labels. Sleepers show stacked berths (lower/upper) on the
     * doubled side; all other cells use their column letter (A, B, C, ...).
     */
    private List<String> rowLabels(SeatTemplate.DeckConfiguration deck) {
        int leftSeats = deck.getLeftSeats();
        int rightSeats = deck.getRightSeats();
        SeatType seatType = deck.getSeatType() == null ? SeatType.SEAT : deck.getSeatType();

        List<String> labels = new ArrayList<>();

        if (seatType == SeatType.SLEEPER) {
            if (leftSeats == 2) {
                labels.add("AL");
                labels.add("AU");
            } else if (leftSeats == 1) {
                labels.add("A");
            } else {
                addColumns(labels, 0, leftSeats);
            }
            if (rightSeats == 2) {
                labels.add("BL");
                labels.add("BU");
            } else if (rightSeats == 1) {
                labels.add("B");
            } else {
                addColumns(labels, leftSeats, rightSeats);
            }
        } else {
            addColumns(labels, 0, leftSeats + rightSeats);
        }
        return labels;
    }

    private void addColumns(List<String> labels, int start, int count) {
        for (int i = start; i < start + count; i++) {
            labels.add(String.valueOf(LETTERS.charAt(i)));
        }
    }

    /**
     * Position of a seat within a row: the first and last cells sit against
     * the bus walls (window), the cells next to the aisle (one on each side)
     * are aisle seats and everything else is a middle seat.
     */
    private SeatPosition positionFor(int column, int columns, int leftSeats) {
        if (column == 1 || column == columns) {
            return SeatPosition.WINDOW;
        }
        if (column == leftSeats || column == leftSeats + 1) {
            return SeatPosition.AISLE;
        }
        return SeatPosition.MIDDLE;
    }

    private boolean isLowerDeck(SeatTemplate.DeckConfiguration deck) {
        if (deck.getDeckNumber() != null) {
            return deck.getDeckNumber() == 1;
        }
        // Single-deck templates have no explicit deck number - treat them as
        // the only (lower) deck.
        return true;
    }

    private int requirePositive(Integer value, String field) {
        if (value == null || value < 1) {
            throw new IllegalArgumentException(
                    "Deck configuration must have a positive " + field);
        }
        return value;
    }
}