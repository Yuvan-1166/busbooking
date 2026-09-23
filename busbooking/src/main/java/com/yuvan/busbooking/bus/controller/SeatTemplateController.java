package com.yuvan.busbooking.bus.controller;

import com.yuvan.busbooking.bus.dto.SeatRequest;
import com.yuvan.busbooking.bus.dto.SeatResponse;
import com.yuvan.busbooking.bus.dto.SeatTemplateRequest;
import com.yuvan.busbooking.bus.dto.SeatTemplateResponse;
import com.yuvan.busbooking.bus.entity.DeckType;
import com.yuvan.busbooking.bus.entity.Seat;
import com.yuvan.busbooking.bus.service.SeatService;
import com.yuvan.busbooking.bus.service.SeatTemplateService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/seat-templates")
@CrossOrigin(origins = "*")
@Slf4j
public class SeatTemplateController {

    private final SeatTemplateService seatTemplateService;
    private final SeatService seatService;

    public SeatTemplateController(SeatTemplateService seatTemplateService, SeatService seatService) {
        this.seatTemplateService = seatTemplateService;
        this.seatService = seatService;
    }

    /**
     * GET /api/v1/seat-templates
     * Get all active seat templates
     */
    @GetMapping
    public ResponseEntity<List<SeatTemplateResponse>> getAllTemplates(
            @RequestParam(required = false) DeckType deckType
    ) {
        try {
            List<SeatTemplateResponse> templates;
            
            if (deckType != null) {
                templates = seatTemplateService.getTemplatesByDeckType(deckType);
            } else {
                templates = seatTemplateService.getAllActiveTemplates();
            }

            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            log.error("Error fetching templates", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/v1/seat-templates/{id}
     * Get a specific template by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SeatTemplateResponse> getTemplateById(@PathVariable Long id) {
        try {
            SeatTemplateResponse template = seatTemplateService.getTemplateById(id);
            return ResponseEntity.ok(template);
        } catch (RuntimeException e) {
            log.error("Template not found: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/v1/seat-templates/{id}/preview
     * Preview seats that would be created from this template
     * Query params: rows - optional per-deck row counts (comma separated,
     * in the same order as the template decks)
     */
    @GetMapping("/{id}/preview")
    public ResponseEntity<List<SeatRequest>> previewTemplate(
            @PathVariable Long id,
            @RequestParam(required = false) List<Integer> rows
    ) {
        try {
            List<SeatRequest> preview = seatTemplateService.previewTemplateSeats(id, rows);
            return ResponseEntity.ok(preview);
        } catch (RuntimeException e) {
            log.error("Template not found: {}", id, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error previewing template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /api/v1/seat-templates
     * Create a new seat template
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeatTemplateResponse> createTemplate(
            @Valid @RequestBody SeatTemplateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(seatTemplateService.createTemplate(request));
    }

    /**
     * PUT /api/v1/seat-templates/{id}
     * Update an existing seat template
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeatTemplateResponse> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody SeatTemplateRequest request
    ) {
        return ResponseEntity.ok(
                seatTemplateService.updateTemplate(id, request)
        );
    }

    /**
     * DELETE /api/v1/seat-templates/{id}
     * Delete a seat template
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        seatTemplateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v1/seat-templates/{id}/apply
     * Apply a template to a bus. Operators may only apply to their own buses.
     * Request body: { "busId": 123, "clearExisting": true, "rows": [10, 12] }
     * rows is optional and overrides the template's default per-deck row counts.
     */
    @PostMapping("/{id}/apply")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public ResponseEntity<List<SeatResponse>> applyTemplate(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        try {
            Long busId = ((Number) request.get("busId")).longValue();
            Boolean clearExisting = request.containsKey("clearExisting")
                ? (Boolean) request.get("clearExisting")
                : false;
            List<Integer> rows = parseRowsOverride(request.get("rows"));

            log.info("Applying template {} to bus {}. Clear existing: {}", id, busId, clearExisting);

            List<Seat> createdSeats = seatTemplateService.applyTemplateToBus(busId, id, clearExisting, rows);

            List<SeatResponse> response = createdSeats.stream()
                    .map(seat -> seatService.toResponse(seat))
                    .collect(Collectors.toList());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (RuntimeException e) {
            log.error("Error applying template", e);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error applying template", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Read an optional "rows" array from a request body, e.g. [10, 12].
     */
    private List<Integer> parseRowsOverride(Object raw) {
        if (!(raw instanceof List<?> values)) {
            return null;
        }
        List<Integer> rows = values.stream()
                .map(value -> ((Number) value).intValue())
                .collect(Collectors.toList());
        return rows.isEmpty() ? null : rows;
    }
}
