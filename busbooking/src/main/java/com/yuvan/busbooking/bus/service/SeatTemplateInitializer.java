package com.yuvan.busbooking.bus.service;

import com.yuvan.busbooking.bus.entity.*;
import com.yuvan.busbooking.bus.repository.SeatTemplateRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Initializes the database with pre-built seat arrangement templates.
 * These templates represent common modern bus configurations used in intercity travel.
 */
@Configuration
@Slf4j
public class SeatTemplateInitializer {

    @Bean
    @Transactional
    CommandLineRunner initSeatTemplates(SeatTemplateRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                log.info("Seat templates already exist. Skipping initialization.");
                return;
            }

            log.info("Initializing pre-built seat templates...");

            List<SeatTemplate> templates = new ArrayList<>();

            // 1. AC Seater 2+2 (Standard)
            templates.add(createAcSeater2x2());

            // 2. AC Seater 2+3 (Economy)
            templates.add(createAcSeater2x3());

            // 3. AC Semi-Sleeper 2+2
            templates.add(createSemiSleeper2x2());

            // 4. AC Sleeper 2+1
            templates.add(createSleeper2x1());

            // 5. Volvo Multi-Axle 2+2
            templates.add(createVolvoMultiAxle());

            // 6. Mini Bus 2+1
            templates.add(createMiniBus2x1());

            // 7. Luxury Coach 1+2
            templates.add(createLuxuryCoach1x2());

            // 8. Double Decker Seater 2+2
            templates.add(createDoubleDeckerSeater());

            // 9. Double Decker Sleeper 2+1
            templates.add(createDoubleDeckerSleeper());

            repository.saveAll(templates);
            log.info("Successfully initialized {} seat templates", templates.size());
        };
    }

    /**
     * Standard AC Seater 2+2 - Most common configuration
     * 10 rows, 40 seats total
     */
    private SeatTemplate createAcSeater2x2() {
        List<SeatTemplate.SeatPattern> pattern = new ArrayList<>();
        
        for (int row = 1; row <= 10; row++) {
            // Left window
            pattern.add(createSeatPattern(row, 1, row + "A", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            // Left aisle
            pattern.add(createSeatPattern(row, 2, row + "B", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            // Right aisle
            pattern.add(createSeatPattern(row, 3, row + "C", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            // Right window
            pattern.add(createSeatPattern(row, 4, row + "D", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Add female-reserved seats in first 2 rows (8 seats)
        for (int i = 0; i < 8; i++) {
            pattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(
                1, "Single Deck", 10, 4, 2, pattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(deck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("Standard AC Seater (2+2)");
        template.setTemplateType(BusTemplateType.AC_SEATER_2X2);
        template.setDeckType(DeckType.SINGLE);
        template.setTotalSeats(40);
        template.setDescription("Standard AC seater bus with comfortable 2+2 configuration. Ideal for medium-distance intercity travel.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * AC Seater 2+3 - Economy configuration
     * 11 rows, 55 seats total
     */
    private SeatTemplate createAcSeater2x3() {
        List<SeatTemplate.SeatPattern> pattern = new ArrayList<>();
        
        for (int row = 1; row <= 11; row++) {
            // Left side: 2 seats
            pattern.add(createSeatPattern(row, 1, row + "A", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 2, row + "B", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            
            // Right side: 3 seats
            pattern.add(createSeatPattern(row, 3, row + "C", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 4, row + "D", SeatType.SEAT, SeatPosition.MIDDLE, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 5, row + "E", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Female-reserved first 2 rows (10 seats)
        for (int i = 0; i < 10; i++) {
            pattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(
                1, "Single Deck", 11, 5, 2, pattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(deck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("Economy AC Seater (2+3)");
        template.setTemplateType(BusTemplateType.AC_SEATER_2X3);
        template.setDeckType(DeckType.SINGLE);
        template.setTotalSeats(55);
        template.setDescription("Budget-friendly AC seater with 2+3 configuration. Maximum capacity for cost-effective travel.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * AC Semi-Sleeper 2+2 - Reclining seats with extra legroom
     * 9 rows, 36 seats total
     */
    private SeatTemplate createSemiSleeper2x2() {
        List<SeatTemplate.SeatPattern> pattern = new ArrayList<>();
        
        for (int row = 1; row <= 9; row++) {
            pattern.add(createSeatPattern(row, 1, row + "A", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 2, row + "B", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 3, row + "C", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 4, row + "D", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Female-reserved first row
        for (int i = 0; i < 4; i++) {
            pattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(
                1, "Single Deck", 9, 4, 2, pattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(deck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("AC Semi-Sleeper (2+2)");
        template.setTemplateType(BusTemplateType.SEMI_SLEEPER_2X2);
        template.setDeckType(DeckType.SINGLE);
        template.setTotalSeats(36);
        template.setDescription("Semi-sleeper bus with reclining seats and extra legroom. Perfect for comfortable overnight journeys.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * AC Sleeper 2+1 - Full sleeper configuration
     * 9 rows, 27 berths total
     */
    private SeatTemplate createSleeper2x1() {
        List<SeatTemplate.SeatPattern> pattern = new ArrayList<>();
        
        for (int row = 1; row <= 9; row++) {
            // Left side: 2 berths (stacked)
            pattern.add(createSeatPattern(row, 1, row + "AL", SeatType.SLEEPER, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 2, row + "AU", SeatType.SLEEPER, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            
            // Right side: 1 berth
            pattern.add(createSeatPattern(row, 3, row + "B", SeatType.SLEEPER, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Female-reserved first 2 rows (6 berths)
        for (int i = 0; i < 6; i++) {
            pattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(
                1, "Single Deck", 9, 3, 2, pattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(deck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("AC Sleeper (2+1)");
        template.setTemplateType(BusTemplateType.SLEEPER_2X1);
        template.setDeckType(DeckType.SINGLE);
        template.setTotalSeats(27);
        template.setDescription("Comfortable sleeper bus with 2+1 berth configuration. Ideal for long overnight journeys.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * Volvo Multi-Axle 2+2 - Premium configuration
     * 11 rows, 44 seats total
     */
    private SeatTemplate createVolvoMultiAxle() {
        List<SeatTemplate.SeatPattern> pattern = new ArrayList<>();
        
        for (int row = 1; row <= 11; row++) {
            pattern.add(createSeatPattern(row, 1, row + "A", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 2, row + "B", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 3, row + "C", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 4, row + "D", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Female-reserved first 2 rows
        for (int i = 0; i < 8; i++) {
            pattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(
                1, "Single Deck", 11, 4, 2, pattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(deck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("Volvo Multi-Axle (2+2)");
        template.setTemplateType(BusTemplateType.VOLVO_MULTI_AXLE);
        template.setDeckType(DeckType.SINGLE);
        template.setTotalSeats(44);
        template.setDescription("Premium Volvo multi-axle bus with spacious 2+2 seating. Superior comfort for long-distance travel.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * Mini Bus 2+1 - Compact configuration
     * 7 rows, 21 seats total
     */
    private SeatTemplate createMiniBus2x1() {
        List<SeatTemplate.SeatPattern> pattern = new ArrayList<>();
        
        for (int row = 1; row <= 7; row++) {
            // Left side: 2 seats
            pattern.add(createSeatPattern(row, 1, row + "A", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 2, row + "B", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            
            // Right side: 1 seat
            pattern.add(createSeatPattern(row, 3, row + "C", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Female-reserved first row
        for (int i = 0; i < 3; i++) {
            pattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(
                1, "Single Deck", 7, 3, 2, pattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(deck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("Mini Bus (2+1)");
        template.setTemplateType(BusTemplateType.MINI_BUS_2X1);
        template.setDeckType(DeckType.SINGLE);
        template.setTotalSeats(21);
        template.setDescription("Compact mini bus perfect for short routes and smaller groups. Efficient 2+1 configuration.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * Luxury Coach 1+2 - Premium spacious configuration
     * 10 rows, 30 seats total
     */
    private SeatTemplate createLuxuryCoach1x2() {
        List<SeatTemplate.SeatPattern> pattern = new ArrayList<>();
        
        for (int row = 1; row <= 10; row++) {
            // Left side: 1 seat
            pattern.add(createSeatPattern(row, 1, row + "A", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            
            // Right side: 2 seats
            pattern.add(createSeatPattern(row, 2, row + "B", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            pattern.add(createSeatPattern(row, 3, row + "C", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Female-reserved first 2 rows
        for (int i = 0; i < 6; i++) {
            pattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(
                1, "Single Deck", 10, 3, 1, pattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(deck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("Luxury Coach (1+2)");
        template.setTemplateType(BusTemplateType.LUXURY_COACH_1X2);
        template.setDeckType(DeckType.SINGLE);
        template.setTotalSeats(30);
        template.setDescription("Premium luxury coach with extra-wide 1+2 seating. Maximum comfort and space for VIP travel.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * Double Decker Seater 2+2
     * Lower: 8 rows, 32 seats
     * Upper: 10 rows, 40 seats
     * Total: 72 seats
     */
    private SeatTemplate createDoubleDeckerSeater() {
        // Lower deck
        List<SeatTemplate.SeatPattern> lowerPattern = new ArrayList<>();
        for (int row = 1; row <= 8; row++) {
            lowerPattern.add(createSeatPattern(row, 1, "L" + row + "A", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            lowerPattern.add(createSeatPattern(row, 2, "L" + row + "B", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            lowerPattern.add(createSeatPattern(row, 3, "L" + row + "C", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            lowerPattern.add(createSeatPattern(row, 4, "L" + row + "D", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Female-reserved first 2 rows on lower deck
        for (int i = 0; i < 8; i++) {
            lowerPattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration lowerDeck = new SeatTemplate.DeckConfiguration(
                1, "Lower Deck", 8, 4, 2, lowerPattern
        );

        // Upper deck
        List<SeatTemplate.SeatPattern> upperPattern = new ArrayList<>();
        for (int row = 1; row <= 10; row++) {
            upperPattern.add(createSeatPattern(row, 1, "U" + row + "A", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            upperPattern.add(createSeatPattern(row, 2, "U" + row + "B", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            upperPattern.add(createSeatPattern(row, 3, "U" + row + "C", SeatType.SEAT, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            upperPattern.add(createSeatPattern(row, 4, "U" + row + "D", SeatType.SEAT, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        SeatTemplate.DeckConfiguration upperDeck = new SeatTemplate.DeckConfiguration(
                2, "Upper Deck", 10, 4, 2, upperPattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(lowerDeck, upperDeck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("Double Decker Seater (2+2)");
        template.setTemplateType(BusTemplateType.DOUBLE_DECKER_SEATER);
        template.setDeckType(DeckType.DOUBLE);
        template.setTotalSeats(72);
        template.setDescription("High-capacity double decker bus with 2+2 seating on both levels. Ideal for high-demand routes.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * Double Decker Sleeper 2+1
     * Lower: 6 rows, 18 berths
     * Upper: 8 rows, 24 berths
     * Total: 42 berths
     */
    private SeatTemplate createDoubleDeckerSleeper() {
        // Lower deck
        List<SeatTemplate.SeatPattern> lowerPattern = new ArrayList<>();
        for (int row = 1; row <= 6; row++) {
            lowerPattern.add(createSeatPattern(row, 1, "L" + row + "AL", SeatType.SLEEPER, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            lowerPattern.add(createSeatPattern(row, 2, "L" + row + "AU", SeatType.SLEEPER, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            lowerPattern.add(createSeatPattern(row, 3, "L" + row + "B", SeatType.SLEEPER, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        // Female-reserved first 2 rows on lower deck
        for (int i = 0; i < 6; i++) {
            lowerPattern.get(i).setGenderPolicy(SeatGenderPolicy.FEMALE_PREFERRED);
        }

        SeatTemplate.DeckConfiguration lowerDeck = new SeatTemplate.DeckConfiguration(
                1, "Lower Deck", 6, 3, 2, lowerPattern
        );

        // Upper deck
        List<SeatTemplate.SeatPattern> upperPattern = new ArrayList<>();
        for (int row = 1; row <= 8; row++) {
            upperPattern.add(createSeatPattern(row, 1, "U" + row + "AL", SeatType.SLEEPER, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
            upperPattern.add(createSeatPattern(row, 2, "U" + row + "AU", SeatType.SLEEPER, SeatPosition.AISLE, SeatGenderPolicy.ANY));
            upperPattern.add(createSeatPattern(row, 3, "U" + row + "B", SeatType.SLEEPER, SeatPosition.WINDOW, SeatGenderPolicy.ANY));
        }

        SeatTemplate.DeckConfiguration upperDeck = new SeatTemplate.DeckConfiguration(
                2, "Upper Deck", 8, 3, 2, upperPattern
        );

        SeatTemplate.TemplateConfiguration config = new SeatTemplate.TemplateConfiguration(
                List.of(lowerDeck, upperDeck)
        );

        SeatTemplate template = new SeatTemplate();
        template.setName("Double Decker Sleeper (2+1)");
        template.setTemplateType(BusTemplateType.DOUBLE_DECKER_SLEEPER);
        template.setDeckType(DeckType.DOUBLE);
        template.setTotalSeats(42);
        template.setDescription("Premium double decker sleeper bus with comfortable berths on both levels. Perfect for overnight long-distance routes.");
        template.setConfiguration(config);
        template.setIsActive(true);

        return template;
    }

    /**
     * Helper method to create a seat pattern entry
     */
    private SeatTemplate.SeatPattern createSeatPattern(
            int row, int col, String seatNumber,
            SeatType type, SeatPosition position, SeatGenderPolicy genderPolicy
    ) {
        return new SeatTemplate.SeatPattern(row, col, seatNumber, type, position, genderPolicy);
    }
}
