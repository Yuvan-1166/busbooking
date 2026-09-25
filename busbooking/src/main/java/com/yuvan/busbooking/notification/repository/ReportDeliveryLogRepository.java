package com.yuvan.busbooking.notification.repository;

import com.yuvan.busbooking.notification.entity.ReportDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportDeliveryLogRepository extends JpaRepository<ReportDeliveryLog, Long> {
}