package com.yuvan.busbooking.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

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
