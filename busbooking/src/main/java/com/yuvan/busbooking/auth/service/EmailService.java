package com.yuvan.busbooking.auth.service;

import com.yuvan.busbooking.booking.dto.BookingPassengerResponse;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String fromAddress,
            @Value("${app.otp.mail.from-name:Bus Booking}") String fromName
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    /**
     * Sends an OTP verification email.
     *
     * @param toEmail   recipient email
     * @param otp       6-digit plain-text OTP (stored hashed separately)
     * @param expiryMin minutes until the OTP expires (shown in the email body)
     */
    public void sendOtp(String toEmail, String otp, int expiryMin) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Your Bus Booking verification code: " + otp);
            helper.setText(buildEmailBody(otp, expiryMin), true);

            mailSender.send(message);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            throw new RuntimeException("Failed to send OTP email to " + toEmail, e);
        }
    }

    /**
     * Sends a password reset OTP email.
     *
     * @param toEmail   recipient email
     * @param otp       6-digit plain-text OTP
     * @param expiryMin minutes until the OTP expires
     */
    public void sendPasswordResetOtp(String toEmail, String otp, int expiryMin) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Reset your Bus Booking password: " + otp);
            helper.setText(buildPasswordResetEmailBody(otp, expiryMin), true);

            mailSender.send(message);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            throw new RuntimeException(
                    "Failed to send password reset email to " + toEmail, e);
        }
    }

    private String buildEmailBody(String otp, int expiryMin) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"/></head>
                <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
                    <tr><td align="center">
                      <table width="540" cellpadding="0" cellspacing="0" style="background:#fafaf6;border:1px solid #e7e5dc;max-width:540px;width:100%%;">

                        <!-- Header -->
                        <tr>
                          <td style="background:#202622;padding:28px 36px;">
                            <span style="display:inline-block;width:28px;height:28px;background:#f9d66d;border-radius:50%%;text-align:center;line-height:28px;font-size:14px;font-weight:bold;color:#202622;">B</span>
                            <span style="color:#ffffff;font-size:11px;letter-spacing:.13em;font-family:monospace;margin-left:10px;">BUS BOOKING</span>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding:40px 36px 28px;">
                            <p style="margin:0 0 8px;font-size:10px;letter-spacing:.13em;color:#4a7c59;font-family:monospace;">VERIFICATION CODE</p>
                            <h1 style="margin:0 0 20px;font-size:32px;font-weight:700;color:#202622;">Verify your email.</h1>
                            <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#606a5d;">
                              Enter the code below in the app to complete your registration.
                              It expires in <strong>%d minutes</strong>.
                            </p>

                            <!-- OTP box -->
                            <div style="background:#202622;padding:24px 0;text-align:center;margin-bottom:28px;">
                              <span style="font-size:40px;font-weight:700;letter-spacing:.3em;color:#f9d66d;font-family:monospace;">%s</span>
                            </div>

                            <p style="margin:0;font-size:12px;color:#929d8e;line-height:1.5;">
                              If you did not create a Bus Booking account, you can safely ignore this email.
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="padding:18px 36px;border-top:1px solid #e7e5dc;">
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
                """.formatted(expiryMin, otp);
    }

    // ─── Booking Confirmation ────────────────────────────────────────────────

    /**
     * Sends a booking confirmation email after successful payment.
     *
     * @param toEmail         recipient email address
     * @param passengerName   user's first name (used in the greeting)
     * @param bookingRef      booking reference (e.g. BUS-ABCD1234EF56)
     * @param ticketNumber    generated ticket number (e.g. TKT-ABCD12345678)
     * @param tripDate        date of the trip
     * @param departureTime   departure time of the trip
     * @param fromCity        pickup city name
     * @param toCity          drop city name
     * @param passengers      list of booked passengers with seat numbers
     * @param totalAmount     total fare charged
     */
    public void sendBookingConfirmation(
            String toEmail,
            String passengerName,
            String bookingRef,
            String ticketNumber,
            LocalDate tripDate,
            LocalTime departureTime,
            String fromCity,
            String toCity,
            List<BookingPassengerResponse> passengers,
            BigDecimal totalAmount
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Booking Confirmed – " + bookingRef);
            helper.setText(buildBookingConfirmationBody(
                    passengerName, bookingRef, ticketNumber,
                    tripDate, departureTime, fromCity, toCity,
                    passengers, totalAmount), true);

            mailSender.send(message);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            throw new RuntimeException(
                    "Failed to send booking confirmation email to " + toEmail, e);
        }
    }

    private String buildBookingConfirmationBody(
            String passengerName,
            String bookingRef,
            String ticketNumber,
            LocalDate tripDate,
            LocalTime departureTime,
            String fromCity,
            String toCity,
            List<BookingPassengerResponse> passengers,
            BigDecimal totalAmount
    ) {
        String dateStr = tripDate.format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String timeStr = departureTime.format(DateTimeFormatter.ofPattern("hh:mm a"));

        // Build passenger rows
        StringBuilder passengerRows = new StringBuilder();
        for (int i = 0; i < passengers.size(); i++) {
            BookingPassengerResponse p = passengers.get(i);
            String rowBg = (i % 2 == 0) ? "#f0ede3" : "#fafaf6";
            passengerRows.append("""
                    <tr style="background:%s;">
                      <td style="padding:8px 12px;font-size:13px;color:#202622;">%s %s</td>
                      <td style="padding:8px 12px;font-size:13px;color:#202622;text-align:center;">%s</td>
                      <td style="padding:8px 12px;font-size:13px;color:#202622;text-align:center;">%d</td>
                    </tr>
                    """.formatted(
                    rowBg,
                    escapeHtml(p.firstName()),
                    escapeHtml(p.lastName()),
                    escapeHtml(p.seatNumber()),
                    p.age()
            ));
        }

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"/></head>
                <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
                    <tr><td align="center">
                      <table width="540" cellpadding="0" cellspacing="0" style="background:#fafaf6;border:1px solid #e7e5dc;max-width:540px;width:100%%;">

                        <!-- Header -->
                        <tr>
                          <td style="background:#202622;padding:28px 36px;">
                            <span style="display:inline-block;width:28px;height:28px;background:#f9d66d;border-radius:50%%;text-align:center;line-height:28px;font-size:14px;font-weight:bold;color:#202622;">B</span>
                            <span style="color:#ffffff;font-size:11px;letter-spacing:.13em;font-family:monospace;margin-left:10px;">BUS BOOKING</span>
                          </td>
                        </tr>

                        <!-- Title -->
                        <tr>
                          <td style="padding:36px 36px 0;">
                            <p style="margin:0 0 8px;font-size:10px;letter-spacing:.13em;color:#4a7c59;font-family:monospace;">BOOKING CONFIRMED</p>
                            <h1 style="margin:0 0 12px;font-size:28px;font-weight:700;color:#202622;">Your seats are booked!</h1>
                            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#606a5d;">
                              Hi %s, your booking is confirmed. Here are the details for your upcoming journey.
                            </p>
                          </td>
                        </tr>

                        <!-- Journey summary box -->
                        <tr>
                          <td style="padding:0 36px 24px;">
                            <table width="100%%" cellpadding="0" cellspacing="0" style="background:#202622;border-radius:4px;">
                              <tr>
                                <td style="padding:20px 24px;">
                                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:.12em;color:#a8b5a0;font-family:monospace;">FROM → TO</p>
                                  <p style="margin:0 0 14px;font-size:20px;font-weight:700;color:#f9d66d;letter-spacing:.02em;">
                                    %s &nbsp;→&nbsp; %s
                                  </p>
                                  <table cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="padding-right:28px;">
                                        <p style="margin:0;font-size:10px;letter-spacing:.1em;color:#a8b5a0;font-family:monospace;">DATE</p>
                                        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#ffffff;">%s</p>
                                      </td>
                                      <td>
                                        <p style="margin:0;font-size:10px;letter-spacing:.1em;color:#a8b5a0;font-family:monospace;">DEPARTURE</p>
                                        <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#ffffff;">%s</p>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Reference & Ticket numbers -->
                        <tr>
                          <td style="padding:0 36px 24px;">
                            <table width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e5dc;">
                              <tr>
                                <td style="padding:14px 18px;border-right:1px solid #e7e5dc;width:50%%;">
                                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:.1em;color:#929d8e;font-family:monospace;">BOOKING REF</p>
                                  <p style="margin:0;font-size:14px;font-weight:700;color:#202622;font-family:monospace;">%s</p>
                                </td>
                                <td style="padding:14px 18px;width:50%%;">
                                  <p style="margin:0 0 4px;font-size:10px;letter-spacing:.1em;color:#929d8e;font-family:monospace;">TICKET NO.</p>
                                  <p style="margin:0;font-size:14px;font-weight:700;color:#202622;font-family:monospace;">%s</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Passenger table -->
                        <tr>
                          <td style="padding:0 36px 28px;">
                            <p style="margin:0 0 10px;font-size:10px;letter-spacing:.13em;color:#929d8e;font-family:monospace;">PASSENGERS</p>
                            <table width="100%%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e5dc;border-collapse:collapse;">
                              <thead>
                                <tr style="background:#e7e5dc;">
                                  <th style="padding:8px 12px;font-size:10px;letter-spacing:.1em;color:#606a5d;text-align:left;font-family:monospace;font-weight:600;">NAME</th>
                                  <th style="padding:8px 12px;font-size:10px;letter-spacing:.1em;color:#606a5d;text-align:center;font-family:monospace;font-weight:600;">SEAT</th>
                                  <th style="padding:8px 12px;font-size:10px;letter-spacing:.1em;color:#606a5d;text-align:center;font-family:monospace;font-weight:600;">AGE</th>
                                </tr>
                              </thead>
                              <tbody>
                                %s
                              </tbody>
                            </table>
                          </td>
                        </tr>

                        <!-- Total amount -->
                        <tr>
                          <td style="padding:0 36px 32px;">
                            <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0ede3;border:1px solid #e7e5dc;">
                              <tr>
                                <td style="padding:14px 18px;">
                                  <p style="margin:0;font-size:10px;letter-spacing:.1em;color:#929d8e;font-family:monospace;">TOTAL AMOUNT PAID</p>
                                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#202622;">&#8377; %s</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="padding:18px 36px;border-top:1px solid #e7e5dc;">
                            <p style="margin:0;font-size:11px;color:#929d8e;line-height:1.5;">
                              Please carry a valid photo ID when boarding. Show this email or your ticket number at the boarding point.
                            </p>
                            <p style="margin:8px 0 0;font-size:10px;color:#b0b5ac;font-family:monospace;letter-spacing:.05em;">
                              BUS BOOKING · DO NOT REPLY
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                escapeHtml(passengerName),
                escapeHtml(fromCity), escapeHtml(toCity),
                dateStr, timeStr,
                escapeHtml(bookingRef), escapeHtml(ticketNumber),
                passengerRows,
                totalAmount.toPlainString()
        );
    }

    /** Minimal HTML escaping to prevent injection in email bodies. */
    private String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String buildPasswordResetEmailBody(String otp, int expiryMin) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"/></head>
                <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
                    <tr><td align="center">
                      <table width="540" cellpadding="0" cellspacing="0" style="background:#fafaf6;border:1px solid #e7e5dc;max-width:540px;width:100%%;">

                        <!-- Header -->
                        <tr>
                          <td style="background:#202622;padding:28px 36px;">
                            <span style="display:inline-block;width:28px;height:28px;background:#f9d66d;border-radius:50%%;text-align:center;line-height:28px;font-size:14px;font-weight:bold;color:#202622;">B</span>
                            <span style="color:#ffffff;font-size:11px;letter-spacing:.13em;font-family:monospace;margin-left:10px;">BUS BOOKING</span>
                          </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                          <td style="padding:40px 36px 28px;">
                            <p style="margin:0 0 8px;font-size:10px;letter-spacing:.13em;color:#c0622f;font-family:monospace;">PASSWORD RESET</p>
                            <h1 style="margin:0 0 20px;font-size:32px;font-weight:700;color:#202622;">Reset your password.</h1>
                            <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#606a5d;">
                              Enter the code below to reset your Bus Booking password.
                              It expires in <strong>%d minutes</strong>.
                            </p>

                            <!-- OTP box -->
                            <div style="background:#202622;padding:24px 0;text-align:center;margin-bottom:28px;">
                              <span style="font-size:40px;font-weight:700;letter-spacing:.3em;color:#f9d66d;font-family:monospace;">%s</span>
                            </div>

                            <p style="margin:0;font-size:12px;color:#929d8e;line-height:1.5;">
                              If you did not request a password reset, you can safely ignore this email.
                              Your password will not change.
                            </p>
                          </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                          <td style="padding:18px 36px;border-top:1px solid #e7e5dc;">
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
                """.formatted(expiryMin, otp);
    }
}
