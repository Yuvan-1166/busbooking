package com.yuvan.busbooking.bus.repository;

import com.yuvan.busbooking.bus.entity.BusTemplateType;
import com.yuvan.busbooking.bus.entity.DeckType;
import com.yuvan.busbooking.bus.entity.SeatTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeatTemplateRepository extends JpaRepository<SeatTemplate, Long> {
    
    List<SeatTemplate> findByIsActiveTrue();
    
    List<SeatTemplate> findByDeckTypeAndIsActiveTrue(DeckType deckType);
    
    List<SeatTemplate> findByTemplateTypeAndIsActiveTrue(BusTemplateType templateType);
}
