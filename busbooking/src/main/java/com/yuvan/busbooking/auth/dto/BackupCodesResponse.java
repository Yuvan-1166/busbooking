package com.yuvan.busbooking.auth.dto;

import java.util.List;

/**
 * Response containing backup codes (shown only once)
 */
public record BackupCodesResponse(
        List<String> codes,
        String generatedAt,
        Integer remainingCodes
) {
}
