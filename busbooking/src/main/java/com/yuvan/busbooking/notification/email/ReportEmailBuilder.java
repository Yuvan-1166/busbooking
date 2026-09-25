package com.yuvan.busbooking.notification.email;

import com.yuvan.busbooking.notification.report.ReportContent;
import com.yuvan.busbooking.notification.report.ReportData;
import org.springframework.stereotype.Component;

/**
 * Renders a structured {@link ReportData} into the branded HTML email used by
 * the rest of the app. Dynamic values are HTML-escaped to prevent injection.
 */
@Component
public class ReportEmailBuilder {

    public ReportContent build(ReportData data) {
        String period = escape(data.periodLabel());
        String subject = "Bus Booking · " + data.badgeLabel() + " — " + period;

        StringBuilder body = new StringBuilder(24_000);
        body.append("""
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"/></head>
                <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fafaf6;border:1px solid #e7e5dc;max-width:600px;width:100%%;">

                        <!-- Header -->
                        <tr>
                          <td style="background:#202622;padding:28px 36px;">
                            <span style="display:inline-block;width:28px;height:28px;background:#f9d66d;border-radius:50%%;text-align:center;line-height:28px;font-size:14px;font-weight:bold;color:#202622;">B</span>
                            <span style="color:#ffffff;font-size:11px;letter-spacing:.13em;font-family:monospace;margin-left:10px;">BUS BOOKING · </span>
                            <span style="color:#f9d66d;font-size:11px;letter-spacing:.13em;font-family:monospace;">%s</span>
                          </td>
                        </tr>

                        <!-- Title -->
                        <tr>
                          <td style="padding:36px 36px 0;">
                            <p style="margin:0 0 8px;font-size:10px;letter-spacing:.13em;color:#4a7c59;font-family:monospace;">%s</p>
                            <h1 style="margin:0 0 12px;font-size:28px;font-weight:700;color:#202622;">%s</h1>
                            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#606a5d;">
                              Hi %s, here is your snapshot for <strong>%s</strong>.
                            </p>
                          </td>
                        </tr>
                """.formatted(
                escape(data.badgeLabel()),
                escape(period),
                escape(data.title()),
                escape(data.recipientName()),
                escape(period)
        ));

        body.append(kpiGrid(data.metrics()));
        body.append(sections(data.sections()));

        body.append("""
                        <!-- Footer -->
                        <tr>
                          <td style="padding:18px 36px;border-top:1px solid #e7e5dc;">
                            <p style="margin:0 0 6px;font-size:11px;color:#929d8e;line-height:1.5;">
                              This report was generated automatically. To change the frequency or stop receiving it, update your report preferences in the app.
                            </p>
                            <p style="margin:0;font-size:10px;color:#b0b5ac;font-family:monospace;letter-spacing:.05em;">
                              BUS BOOKING · DO NOT REPLY
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """);

        return new ReportContent(subject, body.toString());
    }

    private String kpiGrid(java.util.List<ReportData.KeyMetric> metrics) {
        StringBuilder html = new StringBuilder();
        html.append("""
                        <tr>
                          <td style="padding:0 36px 12px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                """);
        int index = 0;
        for (ReportData.KeyMetric metric : metrics) {
            String bg = (index % 2 == 1) ? "#f0ede3" : "#fafaf6";
            html.append("""
                      <tr>
                        <td style="padding:14px 18px;background:%s;border:1px solid #e7e5dc;">
                          <p style="margin:0 0 4px;font-size:10px;letter-spacing:.1em;color:#929d8e;font-family:monospace;">%s</p>
                          <p style="margin:0;font-size:20px;font-weight:700;color:#202622;">%s</p>
                        </td>
                      </tr>
                    """.formatted(bg, escape(metric.label()), escape(metric.value())));
            index++;
        }
        html.append("""
              </table>
            </td>
          </tr>
          """);
        return html.toString();
    }

    private String sections(java.util.List<ReportData.DataSection> sections) {
        StringBuilder html = new StringBuilder();
        for (ReportData.DataSection section : sections) {
            html.append("""
                        <tr>
                          <td style="padding:24px 36px 0;">
                            <p style="margin:0 0 10px;font-size:10px;letter-spacing:.13em;color:#929d8e;font-family:monospace;">%s</p>
                            <table width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e5dc;border-collapse:collapse;">
                              <thead>
                                <tr style="background:#202622;">
                """.formatted(escape(section.title())));
            for (String header : section.headers()) {
                html.append("""
                    <th style="padding:9px 10px;font-size:10px;letter-spacing:.08em;color:#ffffff;text-align:left;font-family:monospace;font-weight:600;">%s</th>
                  """.formatted(escape(header)));
            }
            html.append("</tr></thead><tbody>");
            for (int i = 0; i < section.rows().size(); i++) {
                String rowBg = (i % 2 == 0) ? "#f0ede3" : "#fafaf6";
                html.append("<tr style=\"background:").append(rowBg).append("\">");
                for (String cell : section.rows().get(i)) {
                    html.append("""
                        <td style="padding:8px 10px;font-size:12px;color:#202622;">%s</td>
                      """.formatted(escape(cell)));
                }
                html.append("</tr>");
            }
            html.append("</tbody></table></td></tr>");
        }
        return html.toString();
    }

    /** Minimal HTML escaping to prevent injection in email bodies. */
    private String escape(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}