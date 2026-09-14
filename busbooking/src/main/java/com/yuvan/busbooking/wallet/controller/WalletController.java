package com.yuvan.busbooking.wallet.controller;

import com.yuvan.busbooking.wallet.dto.WalletResponse;
import com.yuvan.busbooking.wallet.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    /** Returns the wallet balance of the authenticated passenger. */
    @GetMapping
    @PreAuthorize("hasRole('PASSENGER')")
    public ResponseEntity<WalletResponse> getMyWallet() {
        return ResponseEntity.ok(walletService.getMyWallet());
    }
}
