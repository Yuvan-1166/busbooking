package com.yuvan.busbooking.payment.gateway.razorpay;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Registers {@link RazorpayProperties} for {@code app.razorpay.*} binding.
 */
@Configuration
@EnableConfigurationProperties(RazorpayProperties.class)
public class RazorpayConfig {
}