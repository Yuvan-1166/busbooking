package com.yuvan.busbooking.wallet.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record WalletUpdateRequest(
        @NotNull(message = "Balance is required")
        BigDecimal balance
) {
}