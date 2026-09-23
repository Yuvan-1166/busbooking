package com.yuvan.busbooking.bus.service;

import com.yuvan.busbooking.bus.entity.*;
import com.yuvan.busbooking.bus.repository.SeatTemplateRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Seeds the database with the standard set of bus seat arrangements, describing
 * each one by its real-world seat distribution (for example Seater 2+2 or
 * Sleeper 2+1) rather than by vehicle brand or marketing class.
 *
 * <p>The seed is self-healing: whenever the stored template types diverge from
 * the canonical set - for example after this project's migration away from
 * legacy "AC/Premium/Luxury" arrangements - the table is replaced so the
 * operator dashboard always shows the current, industry-standard layouts.
 */
@Configuration
@Slf4j
public class SeatTemplateInitializer {

    /** Fixed layout of a single deck inside a template. */
    private record DeckSpec(int deckNumber, String deckName, int rows, int leftSeats, int rightSeats, SeatType seatType) {
    }

    @Bean
    @Transactional
    CommandLineRunner initSeatTemplates(SeatTemplateRepository repository) {
        return args -> {
            if (!needsReseed(repository)) {
                log.info("Seat templates already up to date. Skipping initialization.");
                return;
            }

            log.info("Seat templates out of date or missing. Reseeding with the standard arrangement set...");

            List<SeatTemplate> templates = buildAll();

            // deleteAllInBatch deletes every row without materialising entities,
            // which is safe even when the stored JSON uses an older schema.
            repository.deleteAllInBatch();
            repository.saveAll(templates);
            log.info("Successfully seeded {} seat templates", templates.size());
        };
    }

    private boolean needsReseed(SeatTemplateRepository repository) {
        Set<String> canonical = Arrays.stream(BusTemplateType.values())
                .map(Enum::name)
                .collect(Collectors.toSet());

        List<String> stored = repository.findDistinctTemplateTypes();

        if (stored.isEmpty()) {
            return true;
        }
        return stored.size() != canonical.size()
                || !stored.containsAll(canonical);
    }

    private List<SeatTemplate> buildAll() {
        return List.of(
                // ---- Single-deck seater ----
                template(BusTemplateType.SEATER_2_PLUS_2,
                        deck(1, "Single Deck", 10, 2, 2, SeatType.SEAT)),
                template(BusTemplateType.SEATER_1_PLUS_2,
                        deck(1, "Single Deck", 11, 1, 2, SeatType.SEAT)),
                template(BusTemplateType.SEATER_2_PLUS_3,
                        deck(1, "Single Deck", 11, 2, 3, SeatType.SEAT)),
                template(BusTemplateType.SEATER_1_PLUS_1,
                        deck(1, "Single Deck", 10, 1, 1, SeatType.SEAT)),

                // ---- Single-deck semi-sleeper ----
                template(BusTemplateType.SEMI_SLEEPER_2_PLUS_2,
                        deck(1, "Single Deck", 9, 2, 2, SeatType.SEMI_SLEEPER)),
                template(BusTemplateType.SEMI_SLEEPER_1_PLUS_2,
                        deck(1, "Single Deck", 10, 1, 2, SeatType.SEMI_SLEEPER)),
                template(BusTemplateType.SEMI_SLEEPER_2_PLUS_3,
                        deck(1, "Single Deck", 10, 2, 3, SeatType.SEMI_SLEEPER)),
                template(BusTemplateType.SEMI_SLEEPER_1_PLUS_1,
                        deck(1, "Single Deck", 10, 1, 1, SeatType.SEMI_SLEEPER)),

                // ---- Single-deck sleeper ----
                template(BusTemplateType.SLEEPER_2_PLUS_1,
                        deck(1, "Single Deck", 12, 2, 1, SeatType.SLEEPER)),
                template(BusTemplateType.SLEEPER_1_PLUS_1,
                        deck(1, "Single Deck", 10, 1, 1, SeatType.SLEEPER)),
                template(BusTemplateType.SLEEPER_2_PLUS_2,
                        deck(1, "Single Deck", 10, 2, 2, SeatType.SLEEPER)),

                // ---- Double-decker ----
                template(BusTemplateType.DOUBLE_DECKER_SEATER_2_PLUS_2,
                        deck(1, "Lower Deck", 8, 2, 2, SeatType.SEAT),
                        deck(2, "Upper Deck", 10, 2, 2, SeatType.SEAT)),
                template(BusTemplateType.DOUBLE_DECKER_SEATER_2_PLUS_3,
                        deck(1, "Lower Deck", 7, 2, 3, SeatType.SEAT),
                        deck(2, "Upper Deck", 8, 2, 3, SeatType.SEAT)),
                template(BusTemplateType.DOUBLE_DECKER_SLEEPER_2_PLUS_1,
                        deck(1, "Lower Deck", 6, 2, 1, SeatType.SLEEPER),
                        deck(2, "Upper Deck", 8, 2, 1, SeatType.SLEEPER)),
                template(BusTemplateType.SLEEPER_CUM_SEATER_2_PLUS_1,
                        deck(1, "Lower Deck", 9, 2, 1, SeatType.SEAT),
                        deck(2, "Upper Deck", 8, 2, 1, SeatType.SLEEPER))
        );
    }

    private DeckSpec deck(int deckNumber, String deckName, int rows, int leftSeats, int rightSeats, SeatType seatType) {
        return new DeckSpec(deckNumber, deckName, rows, leftSeats, rightSeats, seatType);
    }

    private SeatTemplate template(BusTemplateType type, DeckSpec... specs) {
        List<SeatTemplate.DeckConfiguration> decks = Arrays.stream(specs)
                .map(spec -> new SeatTemplate.DeckConfiguration(
                        spec.deckNumber(),
                        spec.deckName(),
                        spec.rows(),
                        spec.leftSeats(),
                        spec.rightSeats(),
                        spec.seatType()
                ))
                .collect(Collectors.toList());

        int totalSeats = Arrays.stream(specs)
                .mapToInt(spec -> spec.rows() * (spec.leftSeats() + spec.rightSeats()))
                .sum();

        SeatTemplate template = new SeatTemplate();
        template.setName(type.getDisplayName());
        template.setTemplateType(type);
        template.setDeckType(type.getDeckType());
        template.setTotalSeats(totalSeats);
        template.setDescription(type.getDescription());
        template.setConfiguration(new SeatTemplate.TemplateConfiguration(decks));
        template.setIsActive(true);

        return template;
    }
}