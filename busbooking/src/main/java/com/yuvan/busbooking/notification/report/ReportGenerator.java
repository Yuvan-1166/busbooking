package com.yuvan.busbooking.notification.report;

import com.yuvan.busbooking.notification.entity.ReportType;
import com.yuvan.busbooking.user.entity.User;


public interface ReportGenerator {

    ReportType supports();

    ReportData generate(User user, ReportPeriod period);
}