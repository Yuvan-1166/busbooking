package com.yuvan.busbooking.analytics.dto;

import java.time.LocalDate;

/**
 * A plain count over time (e.g. new user registrations per day).
 */
public record CountPoint(
        LocalDate date,
        long count
) {
}