package com.yuvan.busbooking.wallet.controller;

import com.yuvan.busbooking.wallet.dto.WalletResponse;
import com.yuvan.busbooking.wallet.dto.WalletUpdateRequest;
import com.yuvan.busbooking.wallet.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<WalletResponse>> findAll() {
        return ResponseEntity.ok(walletService.findAll());
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WalletResponse> findByUserId(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(walletService.findByUserId(userId));
    }

    @PutMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WalletResponse> updateBalance(
            @PathVariable Long userId,
            @Valid @RequestBody WalletUpdateRequest request
    ) {
        return ResponseEntity.ok(
                walletService.updateBalance(userId, request)
        );
    }

    @DeleteMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long userId
    ) {
        walletService.delete(userId);
        return ResponseEntity.noContent().build();
    }
}