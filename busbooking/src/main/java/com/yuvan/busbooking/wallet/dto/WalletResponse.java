package com.yuvan.busbooking.wallet.dto;

import java.math.BigDecimal;

public record WalletResponse(
        Long userId,
        BigDecimal balance
) {}
