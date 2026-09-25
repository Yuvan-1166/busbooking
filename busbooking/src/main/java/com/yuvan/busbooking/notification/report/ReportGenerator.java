package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.user.entity.User;

/**
 * Strategy that builds the structured content ({@link ReportData}) for one
 * {@link ReportType}. Implementations are auto-registered with the
 * {@link ReportGeneratorFactory} by their {@link #supports()} value — adding a
 * new report type means adding one new bean, nothing else.
 */
public interface ReportGenerator {

    ReportType supports();

    ReportData generate(User user, ReportPeriod period);
}