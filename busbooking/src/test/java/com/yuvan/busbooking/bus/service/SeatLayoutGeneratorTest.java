package com.yuvan.busbooking.bus.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yuvan.busbooking.bus.entity.*;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SeatLayoutGeneratorTest {

    private final SeatLayoutGenerator generator = new SeatLayoutGenerator();

    @Test
    void expandsSeater2x2IntoFourCellsPerRow() {
        SeatTemplate template = template(SeatType.SEAT, 2, 2, 10);

        List<SeatLayoutGenerator.GeneratedSeat> seats = generator.generate(template, null);

        assertThat(seats).hasSize(40);
        List<String> rowOneNumbers = seats.subList(0, 4).stream()
                .map(SeatLayoutGenerator.GeneratedSeat::seatNumber)
                .collect(Collectors.toList());
        assertThat(rowOneNumbers).containsExactly("1A", "1B", "1C", "1D");

        Map<String, SeatLayoutGenerator.GeneratedSeat> byNumber = seats.stream()
                .collect(Collectors.toMap(SeatLayoutGenerator.GeneratedSeat::seatNumber, seat -> seat));

        assertThat(byNumber.get("1A").position()).isEqualTo(SeatPosition.WINDOW);
        assertThat(byNumber.get("1B").position()).isEqualTo(SeatPosition.AISLE);
        assertThat(byNumber.get("1C").position()).isEqualTo(SeatPosition.AISLE);
        assertThat(byNumber.get("1D").position()).isEqualTo(SeatPosition.WINDOW);
        assertThat(byNumber.get("1A").aisleAfter()).isEqualTo(2);
        assertThat(byNumber.get("1A").genderPolicy()).isEqualTo(SeatGenderPolicy.FEMALE_PREFERRED);
        assertThat(byNumber.get("3A").genderPolicy()).isEqualTo(SeatGenderPolicy.ANY);
    }

    @Test
    void expandsSleeper2Plus1IntoStackedAndSingleBerths() {
        SeatTemplate template = template(SeatType.SLEEPER, 2, 1, 12);

        List<SeatLayoutGenerator.GeneratedSeat> seats = generator.generate(template, null);

        assertThat(seats).hasSize(12 * 3);
        assertThat(seats.get(0).seatNumber()).isEqualTo("1AL");
        assertThat(seats.get(1).seatNumber()).isEqualTo("1AU");
        assertThat(seats.get(2).seatNumber()).isEqualTo("1B");

        assertThat(seats.get(0).seatType()).isEqualTo(SeatType.SLEEPER);
        assertThat(seats.get(0).position()).isEqualTo(SeatPosition.WINDOW);
        assertThat(seats.get(1).position()).isEqualTo(SeatPosition.AISLE);
        assertThat(seats.get(2).position()).isEqualTo(SeatPosition.WINDOW);
    }

    @Test
    void prefixesNumbersOnDoubleDecker() {
        SeatTemplate template = doubleDeckerTemplate();

        List<SeatLayoutGenerator.GeneratedSeat> seats = generator.generate(template, null);

        long lower = seats.stream().filter(seat -> seat.seatNumber().startsWith("L")).count();
        long upper = seats.stream().filter(seat -> seat.seatNumber().startsWith("U")).count();
        assertThat(lower).isEqualTo(8 * 4);
        assertThat(upper).isEqualTo(10 * 4);
        assertThat(seats).hasSize(72);
    }

    @Test
    void rowOverrideChangesTotalWithoutChangingLayout() {
        SeatTemplate template = template(SeatType.SEAT, 2, 2, 10);

        List<SeatLayoutGenerator.GeneratedSeat> seats = generator.generate(template, List.of(8));

        assertThat(seats).hasSize(32);
        assertThat(seats).noneMatch(seat -> seat.seatNumber().startsWith("9"));
        assertThat(seats.get(28).seatNumber()).isEqualTo("8A");
    }

    @Test
    void rowOverrideMustMatchDeckCount() {
        SeatTemplate template = doubleDeckerTemplate();

        assertThatThrownBy(() -> generator.generate(template, List.of(8)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Row override count");
    }

    @Test
    void totalsMatchGeneratedCount() {
        SeatTemplate single = template(SeatType.SEAT, 2, 2, 10);
        SeatTemplate doubleDecker = doubleDeckerTemplate();

        assertThat(generator.totalSeats(single)).isEqualTo(generator.generate(single, null).size());
        assertThat(generator.totalSeats(doubleDecker))
                .isEqualTo(generator.generate(doubleDecker, null).size());
    }

    @Test
    void configurationSerializesAndDeserializesSymmetrically() throws Exception {
        SeatTemplate template = template(SeatType.SLEEPER, 2, 1, 12);

        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(template.getConfiguration());

        SeatTemplate.TemplateConfiguration back = mapper.readValue(
                json, SeatTemplate.TemplateConfiguration.class);
        assertThat(back.getDecks()).hasSize(1);
        assertThat(back.getDecks().get(0).getLeftSeats()).isEqualTo(2);
        assertThat(back.getDecks().get(0).getRightSeats()).isEqualTo(1);
        assertThat(back.getDecks().get(0).getSeatType()).isEqualTo(SeatType.SLEEPER);
    }

    private SeatTemplate template(SeatType seatType, int leftSeats, int rightSeats, int rows) {
        SeatTemplate.DeckConfiguration deck = new SeatTemplate.DeckConfiguration(
                1, "Single Deck", rows, leftSeats, rightSeats, seatType);
        SeatTemplate template = new SeatTemplate();
        template.setName("Test " + leftSeats + "+" + rightSeats);
        template.setTemplateType(BusTemplateType.SEATER_2_PLUS_2);
        template.setDeckType(DeckType.SINGLE);
        template.setConfiguration(new SeatTemplate.TemplateConfiguration(List.of(deck)));
        return template;
    }

    private SeatTemplate doubleDeckerTemplate() {
        SeatTemplate.DeckConfiguration lower = new SeatTemplate.DeckConfiguration(
                1, "Lower Deck", 8, 2, 2, SeatType.SEAT);
        SeatTemplate.DeckConfiguration upper = new SeatTemplate.DeckConfiguration(
                2, "Upper Deck", 10, 2, 2, SeatType.SEAT);
        SeatTemplate template = new SeatTemplate();
        template.setName("Double Decker Seater 2+2");
        template.setTemplateType(BusTemplateType.DOUBLE_DECKER_SEATER_2_PLUS_2);
        template.setDeckType(DeckType.DOUBLE);
        template.setConfiguration(new SeatTemplate.TemplateConfiguration(List.of(lower, upper)));
        return template;
    }
}