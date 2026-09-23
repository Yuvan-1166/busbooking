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

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SeatTemplateService {

    private final SeatTemplateRepository seatTemplateRepository;
    private final BusRepository busRepository;
    private final SeatRepository seatRepository;
    private final SeatLayoutGenerator layoutGenerator;

    public SeatTemplateService(
            SeatTemplateRepository seatTemplateRepository,
            BusRepository busRepository,
            SeatRepository seatRepository,
            SeatLayoutGenerator layoutGenerator
    ) {
        this.seatTemplateRepository = seatTemplateRepository;
        this.busRepository = busRepository;
        this.seatRepository = seatRepository;
        this.layoutGenerator = layoutGenerator;
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
     * Preview seats that would be created from a template (without saving).
     *
     * @param templateId   the template to preview
     * @param rowsOverride optional per-deck row counts, in the same order as
     *                     the template decks
     */
    public List<SeatRequest> previewTemplateSeats(Long templateId, List<Integer> rowsOverride) {
        SeatTemplate template = seatTemplateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));

        return layoutGenerator.generate(template, rowsOverride).stream()
                .map(spec -> new SeatRequest(
                        null, // busId will be set when applying
                        spec.seatNumber(),
                        spec.deckNumber(),
                        spec.deckName(),
                        spec.seatType(),
                        spec.position(),
                        spec.aisleAfter(),
                        spec.genderPolicy()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Apply a seat template to a bus with the template's default row counts.
     */
    @Transactional
    public List<Seat> applyTemplateToBus(Long busId, Long templateId) {
        return applyTemplateToBus(busId, templateId, false, null);
    }

    /**
     * Apply a seat template to a bus with the template's default row counts.
     *
     * @param clearExisting whether existing seats on the bus should be removed first
     */
    @Transactional
    public List<Seat> applyTemplateToBus(Long busId, Long templateId, boolean clearExisting) {
        return applyTemplateToBus(busId, templateId, clearExisting, null);
    }

    /**
     * Apply a seat template to a bus, optionally with custom per-deck row counts.
     *
     * @param busId        the bus to apply the template to
     * @param templateId   the template to apply
     * @param clearExisting whether existing seats on the bus should be removed first
     * @param rowsOverride optional per-deck row counts, in the same order as
     *                     the template decks
     * @return list of created seats
     */
    @Transactional
    public List<Seat> applyTemplateToBus(
            Long busId,
            Long templateId,
            boolean clearExisting,
            List<Integer> rowsOverride
    ) {
        log.info("Applying template {} to bus {} (clear existing: {})",
                templateId, busId, clearExisting);

        if (clearExisting) {
            clearExistingSeats(busId);
        }

        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + busId));

        SeatTemplate template = seatTemplateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + templateId));

        if (!template.getIsActive()) {
            throw new RuntimeException("Template is not active");
        }

        List<Seat> seatsToCreate = layoutGenerator.generate(template, rowsOverride).stream()
                .map(spec -> {
                    Seat seat = new Seat();
                    seat.setBus(bus);
                    seat.setSeatNumber(spec.seatNumber());
                    seat.setDeckNumber(spec.deckNumber());
                    seat.setDeckName(spec.deckName());
                    seat.setSeatType(spec.seatType());
                    seat.setPosition(spec.position());
                    seat.setAisleAfter(spec.aisleAfter());
                    seat.setGenderPolicy(spec.genderPolicy());
                    return seat;
                })
                .collect(Collectors.toList());

        List<Seat> createdSeats = seatRepository.saveAll(seatsToCreate);

        log.info("Successfully created {} seats for bus {} using template {}",
                createdSeats.size(), busId, template.getName());

        return createdSeats;
    }

    private void clearExistingSeats(Long busId) {
        List<Seat> existingSeats = seatRepository.findByBusIdOrderBySeatNumber(busId);
        if (!existingSeats.isEmpty()) {
            seatRepository.deleteAll(existingSeats);
            log.info("Deleted {} existing seats from bus {}", existingSeats.size(), busId);
        }
    }

    /**
     * Create a new template (for admin use). Seat totals are derived from the
     * configuration so the declared capacity always matches the layout.
     */
    @Transactional
    public SeatTemplateResponse createTemplate(SeatTemplateRequest request) {
        SeatTemplate template = new SeatTemplate();

        template.setName(request.name());
        template.setTemplateType(request.templateType());
        template.setDeckType(request.deckType());
        template.setDescription(request.description());
        template.setConfiguration(request.configuration());
        template.setIsActive(request.isActive() != null ? request.isActive() : true);
        template.setTotalSeats(layoutGenerator.totalSeats(template));

        return SeatTemplateResponse.fromEntity(
                seatTemplateRepository.save(template)
        );
    }

    /**
     * Update an existing template. Seat totals are recomputed from the
     * configuration.
     */
    @Transactional
    public SeatTemplateResponse updateTemplate(Long id, SeatTemplateRequest request) {
        SeatTemplate existing = seatTemplateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));

        existing.setName(request.name());
        existing.setTemplateType(request.templateType());
        existing.setDeckType(request.deckType());
        existing.setDescription(request.description());
        existing.setConfiguration(request.configuration());
        existing.setIsActive(request.isActive() != null ? request.isActive() : existing.getIsActive());
        existing.setTotalSeats(layoutGenerator.totalSeats(existing));

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
                .orElseThrow(() -> new RuntimeException("Template not found with id: " + id));
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