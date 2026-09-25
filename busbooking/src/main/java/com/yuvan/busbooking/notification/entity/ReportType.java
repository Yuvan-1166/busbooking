package com.yuvan.busbooking.notification.entity;

/**
 * The kinds of recurring emailed reports a user can subscribe to.
 *
 * <p>Each report type is produced by exactly one {@code ReportGenerator}
 * implementation, resolved through the {@code ReportGeneratorFactory}.</p>
 */
public enum ReportType {

    /** Fleet-level performance metrics scoped to a single operator. */
    OPERATOR_PERFORMANCE,

    /** Whole-platform summary intended for administrators. */
    PLATFORM_SUMMARY
}