package com.yuvan.busbooking.notification.pdf;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;
import com.yuvan.busbooking.notification.report.ReportData;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;


@Component
public class ReportPdfRenderer {

    static final int MAX_ROWS = 50;

    private static final float MARGIN = 40f;
    private static final int KPI_COLUMNS = 3;

    private static final float HEADER_SIZE = 7.5f;
    private static final float BODY_SIZE = 9f;
    private static final float CELL_PADDING_H = 6f;

    private static final double COLUMN_WIDTH_EXPONENT = 0.6;

    private static final Color INK = new Color(0x20, 0x26, 0x22);
    private static final Color ACCENT = new Color(0x4A, 0x7C, 0x59);
    private static final Color GOLD = new Color(0xF9, 0xD6, 0x6D);
    private static final Color MUTED = new Color(0x92, 0x9D, 0x8E);
    private static final Color HAIRLINE = new Color(0xE7, 0xE5, 0xDC);
    private static final Color BAND = new Color(0xF0, 0xED, 0xE3);
    private static final Color PAPER = new Color(0xFA, 0xFA, 0xF6);

    private static final DateTimeFormatter TIMESTAMP =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.ENGLISH);

    private static final Map<Character, String> SUBSTITUTIONS = Map.ofEntries(
            Map.entry('\u20b9', "Rs "),
            Map.entry('\u2192', "->"),
            Map.entry('\u2190', "<-"),
            Map.entry('\u2194', "<->"),
            Map.entry('\u2018', "'"),
            Map.entry('\u2019', "'"),
            Map.entry('\u201a', "'"),
            Map.entry('\u201c', "\""),
            Map.entry('\u201d', "\""),
            Map.entry('\u2013', "-"),
            Map.entry('\u2014', "-"),
            Map.entry('\u2212', "-"),
            Map.entry('\u2026', "..."),
            Map.entry('\u2022', "-"),
            Map.entry('\u00a0', " "),
            Map.entry('\u00b0', " deg")
    );

    private static final BaseFont SANS = baseFont(BaseFont.HELVETICA);
    private static final BaseFont SANS_BOLD = baseFont(BaseFont.HELVETICA_BOLD);

    private static BaseFont baseFont(String name) {
        try {
            return BaseFont.createFont(name, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        } catch (DocumentException | IOException e) {
            throw new IllegalStateException("Unable to initialise PDF base font " + name, e);
        }
    }

    public byte[] render(ReportData data) {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, MARGIN, MARGIN, MARGIN, MARGIN);
        document.addTitle(toAscii(data.title()));
        document.addCreator("Bus Booking");

        PdfWriter writer = PdfWriter.getInstance(document, buffer);
        writer.setPageEvent(new FooterEvent());
        document.open();

        document.add(brandBand(data));
        document.add(titleBlock(data));
        document.add(kpiGrid(data.metrics()));

        for (ReportData.DataSection section : data.sections()) {
            document.add(sectionLabel(section.title()));
            if (section.headers().isEmpty() || section.rows().isEmpty()) {
                document.add(noRowsNote());
                continue;
            }
            document.add(sectionTable(section));
        }

        document.add(footnote());
        document.close();
        return buffer.toByteArray();
    }

    // \u2500\u2500 Header \u2500\u2500

    private PdfPTable brandBand(ReportData data) {
        Phrase content = new Phrase();
        content.add(new Chunk("BUS BOOKING", font(SANS_BOLD, 9f, Font.BOLD, Color.WHITE)));
        content.add(new Chunk("   " + toAscii(data.badgeLabel()),
                font(SANS, 9f, Font.NORMAL, GOLD)));

        PdfPTable table = borderlessTable();
        table.setSpacingAfter(18f);
        table.addCell(filledCell(content, INK, 14f, 16f));
        return table;
    }

    private PdfPTable titleBlock(ReportData data) {
        Paragraph heading = new Paragraph(toAscii(data.title()),
                font(SANS_BOLD, 20f, Font.BOLD, INK));
        heading.setSpacingAfter(5f);
        heading.setKeepTogether(true);

        Paragraph context = new Paragraph();
        context.setSpacingAfter(18f);
        context.setKeepTogether(true);
        context.add(new Chunk("Prepared for ", font(SANS, 9f, Font.NORMAL, MUTED)));
        context.add(new Chunk(toAscii(data.recipientName()),
                font(SANS, 9f, Font.BOLD, INK)));
        context.add(new Chunk("   |   ", font(SANS, 9f, Font.NORMAL, MUTED)));
        context.add(new Chunk(toAscii(data.periodLabel()),
                font(SANS, 9f, Font.BOLD, INK)));

        PdfPTable table = borderlessTable();
        table.setKeepTogether(true);
        table.addCell(borderlessCell(heading));
        table.addCell(borderlessCell(context));
        return table;
    }

    // \u2500\u2500 Key metrics \u2500\u2500

    private PdfPTable kpiGrid(List<ReportData.KeyMetric> metrics) {
        PdfPTable grid = new PdfPTable(new float[]{1, 1, 1});
        grid.setWidthPercentage(100);
        grid.setSpacingBefore(0);
        grid.setSpacingAfter(18f);

        int index = 0;
        for (ReportData.KeyMetric metric : metrics) {
            grid.addCell(metricCell(metric, index / KPI_COLUMNS));
            index++;
        }
        // Pad the final row so the grid keeps a rectangular shape when the
        // metric count is not a multiple of the column count.
        for (int pad = metrics.size() % KPI_COLUMNS; pad > 0 && pad < KPI_COLUMNS; pad++) {
            grid.addCell(borderlessCell(new Phrase()));
        }
        return grid;
    }

    private PdfPCell metricCell(ReportData.KeyMetric metric, int row) {
        Paragraph content = new Paragraph();
        content.setSpacingBefore(0);
        content.setSpacingAfter(0);
        content.setLeading(13f, 2f);
        content.add(new Chunk(toAscii(metric.label()).toUpperCase(Locale.ROOT),
                font(SANS, 7.5f, Font.NORMAL, MUTED)));
        content.add(Chunk.NEWLINE);
        content.add(new Chunk(toAscii(metric.value()), font(SANS_BOLD, 13f, Font.BOLD, INK)));
        return filledCell(content, row % 2 == 0 ? PAPER : BAND, 10f, 12f);
    }

    // \u2500\u2500 Data sections \u2500\u2500

    private Paragraph sectionLabel(String title) {
        Paragraph label = new Paragraph(toAscii(title).toUpperCase(Locale.ROOT),
                font(SANS_BOLD, 8.5f, Font.BOLD, ACCENT));
        label.setSpacingBefore(0);
        label.setSpacingAfter(6f);
        label.setKeepTogether(true);
        return label;
    }

    private PdfPTable sectionTable(ReportData.DataSection section) {
        int columns = section.headers().size();
        int shown = Math.min(section.rows().size(), MAX_ROWS);

        PdfPTable table = new PdfPTable(columnWeights(section, shown));
        table.setWidthPercentage(100);
        table.setHeaderRows(1);
        table.setSpacingBefore(0);
        table.setSpacingAfter(6f);

        for (String header : section.headers()) {
            Paragraph content = new Paragraph(toAscii(header).toUpperCase(Locale.ROOT),
                    font(SANS_BOLD, HEADER_SIZE, Font.BOLD, Color.WHITE));
            content.setSpacingBefore(0);
            content.setSpacingAfter(0);
            table.addCell(filledCell(content, INK, 7f, CELL_PADDING_H));
        }

        for (int row = 0; row < shown; row++) {
            List<String> cells = section.rows().get(row);
            for (int column = 0; column < columns; column++) {
                String value = column < cells.size() ? cells.get(column) : "";
                table.addCell(bodyCell(value, row));
            }
        }

        if (section.rows().size() > shown) {
            table.addCell(truncationNote(section.rows().size(), shown, columns));
        }
        return table;
    }

    private PdfPCell bodyCell(String value, int row) {
        Paragraph content = new Paragraph(toAscii(value), font(SANS, BODY_SIZE, Font.NORMAL, INK));
        content.setSpacingBefore(0);
        content.setSpacingAfter(0);
        return filledCell(content, row % 2 == 0 ? BAND : PAPER, 7f, CELL_PADDING_H);
    }

    private PdfPCell truncationNote(int total, int shown, int columns) {
        Paragraph content = new Paragraph(
                "Showing the top " + shown + " of " + total
                        + " rows. Narrow the date range to see the rest.",
                font(SANS, 7.5f, Font.ITALIC, MUTED));
        content.setSpacingBefore(0);
        content.setSpacingAfter(0);

        PdfPCell cell = filledCell(content, PAPER, 7f, CELL_PADDING_H);
        cell.setColspan(columns);
        return cell;
    }

    private Paragraph noRowsNote() {
        Paragraph note = new Paragraph("No data recorded for this period.",
                font(SANS, 9f, Font.ITALIC, MUTED));
        note.setSpacingBefore(0);
        note.setSpacingAfter(6f);
        return note;
    }

    // \u2500\u2500 Footer \u2500\u2500

    private Paragraph footnote() {
        Paragraph note = new Paragraph(
                "Generated on " + TIMESTAMP.format(LocalDateTime.now())
                        + " by the Bus Booking reporting service.",
                font(SANS, 7.5f, Font.NORMAL, MUTED));
        note.setSpacingBefore(12f);
        return note;
    }

    /**
     * Draws the hairline and page number once the page body is complete, so
     * multi-page reports stay navigable.
     */
    private static final class FooterEvent extends PdfPageEventHelper {

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            float lineY = MARGIN - 12f;
            float textY = MARGIN - 24f;
            float left = document.leftMargin();
            float right = document.getPageSize().getWidth() - document.rightMargin();

            PdfContentByte canvas = writer.getDirectContent();
            canvas.saveState();
            canvas.setColorStroke(HAIRLINE);
            canvas.setLineWidth(0.5f);
            canvas.moveTo(left, lineY);
            canvas.lineTo(right, lineY);
            canvas.stroke();

            canvas.beginText();
            canvas.setFontAndSize(SANS, 7.5f);
            canvas.setColorFill(MUTED);
            canvas.setTextMatrix(left, textY);
            canvas.showText(toAscii("Bus Booking  |  "
                    + TIMESTAMP.format(LocalDateTime.now())));
            canvas.endText();

            String page = "Page " + writer.getPageNumber();
            canvas.beginText();
            canvas.setTextMatrix(right - SANS.getWidthPoint(page, 7.5f), textY);
            canvas.showText(page);
            canvas.endText();
            canvas.restoreState();
        }
    }

    // \u2500\u2500 Cell helpers \u2500\u2500

    private static PdfPTable borderlessTable() {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        table.setSpacingBefore(0);
        table.setSpacingAfter(0);
        return table;
    }

    private static PdfPCell borderlessCell(Phrase content) {
        PdfPCell cell = new PdfPCell(content);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0);
        cell.setVerticalAlignment(Element.ALIGN_TOP);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        return cell;
    }

    private static PdfPCell filledCell(Phrase content, Color background,
                                       float verticalPadding, float horizontalPadding) {
        PdfPCell cell = new PdfPCell(content);
        cell.setBackgroundColor(background);
        cell.setBorderColor(HAIRLINE);
        cell.setBorderWidth(0.5f);
        cell.setPadding(verticalPadding);
        cell.setPaddingLeft(horizontalPadding);
        cell.setPaddingRight(horizontalPadding);
        cell.setVerticalAlignment(Element.ALIGN_TOP);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        return cell;
    }

    /**
     * Shares the printable width between columns in proportion to the widest
     * thing they must hold, damped by {@link #COLUMN_WIDTH_EXPONENT}. Widths are
     * measured with the real font metrics rather than character counts, because
     * the header and the body are set at different sizes and weights — an even
     * split wraps every currency amount onto two lines and breaks headers
     * mid-word.
     *
     * @return relative widths that sum to 1
     */
    private static float[] columnWeights(ReportData.DataSection section, int shownRows) {
        int columns = section.headers().size();
        if (columns == 0) {
            return new float[1];
        }

        float[] weights = new float[columns];
        float total = 0f;
        for (int column = 0; column < columns; column++) {
            float needed = textWidth(section.headers().get(column),
                    SANS_BOLD, HEADER_SIZE) + 2 * CELL_PADDING_H;
            for (int row = 0; row < shownRows; row++) {
                List<String> cells = section.rows().get(row);
                if (column < cells.size()) {
                    needed = Math.max(needed, textWidth(cells.get(column),
                            SANS, BODY_SIZE) + 2 * CELL_PADDING_H);
                }
            }
            weights[column] = (float) Math.pow(needed, COLUMN_WIDTH_EXPONENT);
            total += weights[column];
        }

        for (int column = 0; column < columns; column++) {
            weights[column] /= total;
        }
        return weights;
    }

    private static float textWidth(String value, BaseFont baseFont, float size) {
        return baseFont.getWidthPoint(toAscii(value), size);
    }

    private static Font font(BaseFont baseFont, float size, int style, Color color) {
        return new Font(baseFont, size, style, color);
    }

    // \u2500\u2500 Text folding \u2500\u2500

    /**
     * Folds a value into the printable ASCII range the base fonts can render,
     * so a missing glyph never turns an amount into a blank cell.
     */
    static String toAscii(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        StringBuilder folded = new StringBuilder(value.length());
        for (int index = 0; index < value.length(); index++) {
            char character = value.charAt(index);
            if (character >= 0x20 && character <= 0x7E) {
                folded.append(character);
                continue;
            }
            String substitution = SUBSTITUTIONS.get(character);
            folded.append(substitution != null ? substitution : "?");
        }
        return folded.toString();
    }
}
