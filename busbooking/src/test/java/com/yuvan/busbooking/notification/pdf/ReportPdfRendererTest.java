package com.yuvan.busbooking.notification.pdf;

import com.yuvan.busbooking.notification.report.ReportData;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class ReportPdfRendererTest {

    private final ReportPdfRenderer renderer = new ReportPdfRenderer();

    @Test
    void producesAnEncodedPdf() {
        byte[] pdf = renderer.render(data());

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 5, StandardCharsets.ISO_8859_1))
                .isEqualTo("%PDF-");
        assertThat(new String(pdf, pdf.length - 6, 6, StandardCharsets.ISO_8859_1))
                .contains("EOF");
    }

    @Test
    void rendersReportsWithNoMetricsOrSections() {
        ReportData empty = new ReportData(
                "Empty report", "OPERATOR REPORT", "01 Sep 2026", "Ravi Kumar",
                List.of(), List.of());

        assertThatCode(() -> renderer.render(empty)).doesNotThrowAnyException();
        assertThat(renderer.render(empty)).isNotEmpty();
    }

    @Test
    void paginatesLongSections() {
        List<List<String>> rows = new ArrayList<>();
        for (int index = 0; index < 400; index++) {
            rows.add(List.of("Route " + index, "10", "₹1,00,000.00"));
        }
        ReportData longReport = new ReportData(
                "Long report", "OPERATOR REPORT", "01 Sep 2026", "Ravi Kumar",
                List.of(new ReportData.KeyMetric("Revenue", "₹1,00,000.00")),
                List.of(new ReportData.DataSection(
                        "Top routes", List.of("Route", "Trips", "Revenue"), rows)));

        byte[] pdf = renderer.render(longReport);

        assertThat(pdf).isNotEmpty();
    }

    @Test
    void truncatesOversizedSections() {
        List<List<String>> rows = new ArrayList<>();
        for (int index = 0; index < ReportPdfRenderer.MAX_ROWS + 25; index++) {
            rows.add(List.of("Route " + index));
        }
        ReportData wide = new ReportData(
                "Wide report", "OPERATOR REPORT", "01 Sep 2026", "Ravi Kumar",
                List.of(),
                List.of(new ReportData.DataSection(
                        "Top routes", List.of("Route"), rows)));

        assertThatCode(() -> renderer.render(wide)).doesNotThrowAnyException();
    }

    @Test
    void foldsTheRupeeSignToPlainAscii() {
        assertThat(ReportPdfRenderer.toAscii("₹12,34,567.00"))
                .isEqualTo("Rs 12,34,567.00");
    }

    @Test
    void foldsGlyphsTheBaseFontsCannotDraw() {
        assertThat(ReportPdfRenderer.toAscii("Banglore → Chennai"))
                .isEqualTo("Banglore -> Chennai");
        assertThat(ReportPdfRenderer.toAscii("24 Sep 2026 – 24 Sep 2026"))
                .isEqualTo("24 Sep 2026 - 24 Sep 2026");
        assertThat(ReportPdfRenderer.toAscii("“quoted” it’s…"))
                .isEqualTo("\"quoted\" it's...");
    }

    @Test
    void degradesUnknownGlyphsWithoutLosingTheLine() {
        assertThat(ReportPdfRenderer.toAscii("Seats 中文 40"))
                .isEqualTo("Seats ?? 40");
    }

    @Test
    void leavesPlainAsciiUntouched() {
        assertThat(ReportPdfRenderer.toAscii("Mumbai - Pune (Express) 42.5%"))
                .isEqualTo("Mumbai - Pune (Express) 42.5%");
    }

    @Test
    void handlesNullAndEmptyValues() {
        assertThat(ReportPdfRenderer.toAscii(null)).isEmpty();
        assertThat(ReportPdfRenderer.toAscii("")).isEmpty();
    }

    private ReportData data() {
        return new ReportData(
                "Your operator performance report",
                "OPERATOR REPORT",
                "24 Sep 2026 – 24 Sep 2026",
                "Ravi Kumar",
                List.of(
                        new ReportData.KeyMetric("Total Revenue", "₹12,000.00"),
                        new ReportData.KeyMetric("Bookings", "42")),
                List.of(new ReportData.DataSection(
                        "Top routes",
                        List.of("Route", "Revenue"),
                        List.of(List.of("Banglore → Chennai", "₹12,000.00")))));
    }
}
