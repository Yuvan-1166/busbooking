package com.yuvan.busbooking.bus.service;

import com.yuvan.busbooking.bus.dto.SeatRequest;
import com.yuvan.busbooking.bus.dto.SeatTemplateRequest;
import com.yuvan.busbooking.bus.dto.SeatTemplateResponse;
import com.yuvan.busbooking.bus.entity.*;
import com.yuvan.busbooking.bus.repository.BusRepository;
import com.yuvan.busbooking.bus.repository.SeatRepository;
import com.yuvan.busbooking.bus.repository.SeatTemplateRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SeatTemplateService {

    private final SeatTemplateRepository seatTemplateRepository;
    private final BusRepository busRepository;
    private final SeatRepository seatRepository;

    public SeatTemplateService(
            SeatTemplateRepository seatTemplateRepository,
            BusRepository busRepository,
            SeatRepository seatRepository
    ) {
        this.seatTemplateRepository = seatTemplateRepository;
        this.busRepository = busRepository;
        this.seatRepository = seatRepository;
    }

    /**
     * Get all active seat templates
     */
    public List<SeatTemplateResponse> getAllActiveTemplates() {
        return seatTemplateRepository.findByIsActiveTrue()
                .stream()
                .map(SeatTemplateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get templates by deck type
     */
    public List<SeatTemplateResponse> getTemplatesByDeckType(DeckType deckType) {
        return seatTemplateRepository.findByDeckTypeAndIsActiveTrue(deckType)
                .stream()
                .map(SeatTemplateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific template by ID
     */
    public SeatTemplateResponse getTemplateById(Long id) {
        SeatTemplate template = seatTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));
        return SeatTemplateResponse.fromEntity(template);
    }

    /**
     * Apply a seat template to a bus.
     * This creates all seats defined in the template for the specified bus.
     *
     * @param busId      The bus to apply the template to
     * @param templateId The template to apply
     * @return List of created seats
     */
    @Transactional
    public List<Seat> applyTemplateToBus(Long busId, Long templateId) {
        log.info("Applying template {} to bus {}", templateId, busId);

        // Validate bus exists
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + busId));

        // Validate template exists
        SeatTemplate template = seatTemplateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));

        if (!template.getIsActive()) {
            throw new RuntimeException("Template is not active");
        }

        // Check if bus already has seats
        List<Seat> existingSeats = seatRepository.findByBusIdOrderBySeatNumber(busId);
        if (!existingSeats.isEmpty()) {
            log.warn("Bus {} already has {} seats. Applying template will add more seats.", busId, existingSeats.size());
            // Optionally, you could throw an exception here or clear existing seats
            // For now, we'll just add the template seats
        }

        // Generate seats from template configuration
        List<Seat> seatsToCreate = generateSeatsFromTemplate(bus, template);

        // Save all seats
        List<Seat> createdSeats = seatRepository.saveAll(seatsToCreate);
        
        log.info("Successfully created {} seats for bus {} using template {}", 
                 createdSeats.size(), busId, template.getName());

        return createdSeats;
    }

    /**
     * Apply template with option to clear existing seats
     */
    @Transactional
    public List<Seat> applyTemplateToBus(Long busId, Long templateId, boolean clearExisting) {
        if (clearExisting) {
            // Delete existing seats first
            List<Seat> existingSeats = seatRepository.findByBusIdOrderBySeatNumber(busId);
            if (!existingSeats.isEmpty()) {
                seatRepository.deleteAll(existingSeats);
                log.info("Deleted {} existing seats from bus {}", existingSeats.size(), busId);
            }
        }

        return applyTemplateToBus(busId, templateId);
    }

    /**
     * Generate seat entities from template configuration
     */
    private List<Seat> generateSeatsFromTemplate(Bus bus, SeatTemplate template) {
        List<Seat> seats = new ArrayList<>();

        SeatTemplate.TemplateConfiguration config = template.getConfiguration();
        
        if (config == null || config.getDecks() == null) {
            throw new RuntimeException("Template configuration is invalid");
        }

        // Process each deck in the configuration
        for (SeatTemplate.DeckConfiguration deck : config.getDecks()) {
            if (deck.getSeatPattern() == null || deck.getSeatPattern().isEmpty()) {
                log.warn("Deck {} has no seat pattern defined", deck.getDeckName());
                continue;
            }

            // Create seats from the pattern
            for (SeatTemplate.SeatPattern pattern : deck.getSeatPattern()) {
                Seat seat = new Seat();
                seat.setBus(bus);
                seat.setSeatNumber(pattern.getSeatNumber());
                seat.setDeckNumber(deck.getDeckNumber());
                seat.setDeckName(deck.getDeckName());
                seat.setSeatType(pattern.getType() != null ? pattern.getType() : SeatType.SEAT);
                seat.setPosition(pattern.getPosition() != null ? pattern.getPosition() : SeatPosition.MIDDLE);
                seat.setAisleAfter(deck.getAisleAfter());
                seat.setGenderPolicy(pattern.getGenderPolicy() != null ? pattern.getGenderPolicy() : SeatGenderPolicy.ANY);
                
                seats.add(seat);
            }
        }

        return seats;
    }

    /**
     * Preview seats that would be created from a template (without saving)
     */
    public List<SeatRequest> previewTemplateSeats(Long templateId) {
        SeatTemplate template = seatTemplateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));

        List<SeatRequest> previewSeats = new ArrayList<>();

        SeatTemplate.TemplateConfiguration config = template.getConfiguration();
        
        if (config == null || config.getDecks() == null) {
            return previewSeats;
        }

        // Process each deck
        for (SeatTemplate.DeckConfiguration deck : config.getDecks()) {
            if (deck.getSeatPattern() == null) continue;

            for (SeatTemplate.SeatPattern pattern : deck.getSeatPattern()) {
                SeatRequest seatRequest = new SeatRequest(
                        null, // busId will be set when applying
                        pattern.getSeatNumber(),
                        deck.getDeckNumber(),
                        deck.getDeckName(),
                        pattern.getType() != null ? pattern.getType() : SeatType.SEAT,
                        pattern.getPosition() != null ? pattern.getPosition() : SeatPosition.MIDDLE,
                        deck.getAisleAfter(),
                        pattern.getGenderPolicy() != null ? pattern.getGenderPolicy() : SeatGenderPolicy.ANY
                );
                previewSeats.add(seatRequest);
            }
        }

        return previewSeats;
    }

    /**
     * Create a new template (for admin use)
     */
    @Transactional
    public SeatTemplateResponse createTemplate(SeatTemplateRequest request) {
        SeatTemplate template = new SeatTemplate();

        template.setName(request.name());
        template.setTemplateType(request.templateType());
        template.setDeckType(request.deckType());
        template.setTotalSeats(request.totalSeats());
        template.setDescription(request.description());
        template.setConfiguration(request.configuration());
        template.setIsActive(request.isActive() != null
                ? request.isActive()
                : true);

        return SeatTemplateResponse.fromEntity(
                seatTemplateRepository.save(template)
        );
    }

    /**
     * Update an existing template
     */
    @Transactional
    public SeatTemplateResponse updateTemplate(
            Long id,
            SeatTemplateRequest request
    ) {
        SeatTemplate existing = seatTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Template not found with id: " + id
                ));

        existing.setName(request.name());
        existing.setTemplateType(request.templateType());
        existing.setDeckType(request.deckType());
        existing.setTotalSeats(request.totalSeats());
        existing.setDescription(request.description());
        existing.setConfiguration(request.configuration());
        existing.setIsActive(request.isActive() != null
                ? request.isActive()
                : existing.getIsActive());

        return SeatTemplateResponse.fromEntity(
                seatTemplateRepository.save(existing)
        );
    }

    /**
     * Deactivate a template
     */
    @Transactional
    public void deactivateTemplate(Long id) {
        SeatTemplate template = seatTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Template not found with id: " + id
                ));
        template.setIsActive(false);
        seatTemplateRepository.save(template);
    }

    /**
     * Hard-delete a template (admin use)
     */
    @Transactional
    public void deleteTemplate(Long id) {
        if (!seatTemplateRepository.existsById(id)) {
            throw new RuntimeException("Template not found with id: " + id);
        }
        seatTemplateRepository.deleteById(id);
    }
}
