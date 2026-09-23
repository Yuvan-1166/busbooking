package com.yuvan.busbooking.bus.repository;

import com.yuvan.busbooking.bus.entity.BusTemplateType;
import com.yuvan.busbooking.bus.entity.DeckType;
import com.yuvan.busbooking.bus.entity.SeatTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SeatTemplateRepository extends JpaRepository<SeatTemplate, Long> {
    
    List<SeatTemplate> findByIsActiveTrue();
    
    List<SeatTemplate> findByDeckTypeAndIsActiveTrue(DeckType deckType);
    
    List<SeatTemplate> findByTemplateTypeAndIsActiveTrue(BusTemplateType templateType);

    /**
     * Stored template type names, read without materialising entities so the
     * seeder can detect stale or missing arrangements even when their JSON
     * configuration uses an older schema.
     */
    @Query(value = "SELECT DISTINCT template_type FROM seat_templates", nativeQuery = true)
    List<String> findDistinctTemplateTypes();
}
