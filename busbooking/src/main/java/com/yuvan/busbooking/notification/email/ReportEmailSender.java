package com.yuvan.busbooking.notification.email;

import com.yuvan.busbooking.notification.report.ReportContent;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Low-level SMTP transport for report emails, isolated so renderers and
 * dispatch logic never touch mail plumbing.
 */
@Service
public class ReportEmailSender {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;

    public ReportEmailSender(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String fromAddress,
            @Value("${app.otp.mail.from-name:Bus Booking}") String fromName
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    public void send(String toEmail, ReportContent content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(content.subject());
            helper.setText(content.htmlBody(), true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Failed to send report email to " + toEmail, e);
        }
    }
}