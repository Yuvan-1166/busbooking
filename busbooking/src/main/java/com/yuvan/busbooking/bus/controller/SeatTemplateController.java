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
import com.yuvan.busbooking.common.util.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/seat-templates")
@CrossOrigin(origins = "*")
@Slf4j
public class SeatTemplateController {

    private final SeatTemplateService seatTemplateService;
    private final SeatService seatService;

    public SeatTemplateController(SeatTemplateService seatTemplateService, SeatService seatService) {
        this.seatTemplateService = seatTemplateService;
        this.seatService = seatService;
    }

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

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeatTemplateResponse> createTemplate(
            @Valid @RequestBody SeatTemplateRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(seatTemplateService.createTemplate(request));
    }
    
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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        seatTemplateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

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
