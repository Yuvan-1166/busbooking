package com.yuvan.busbooking.wallet.service;

import com.yuvan.busbooking.common.exception.ResourceNotFoundException;
import com.yuvan.busbooking.common.util.SecurityUtils;
import com.yuvan.busbooking.user.entity.User;
import com.yuvan.busbooking.user.repository.UserRepository;
import com.yuvan.busbooking.wallet.dto.WalletResponse;
import com.yuvan.busbooking.wallet.entity.UserWallet;
import com.yuvan.busbooking.wallet.repository.UserWalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class WalletService {

    private final UserWalletRepository walletRepository;
    private final UserRepository userRepository;

    public WalletService(
            UserWalletRepository walletRepository,
            UserRepository userRepository
    ) {
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
    }

    /** Create a wallet with the default ₹10,000 balance for a new passenger. */
    @Transactional
    public UserWallet createWallet(User user) {
        UserWallet wallet = new UserWallet();
        wallet.setUser(user);
        wallet.setBalance(new BigDecimal("10000.00"));
        return walletRepository.save(wallet);
    }

    /** Return the wallet of the currently authenticated user. */
    @Transactional(readOnly = true)
    public WalletResponse getMyWallet() {
        String email = SecurityUtils.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        UserWallet wallet = walletRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Wallet not found for user: " + user.getId()));
        return new WalletResponse(user.getId(), wallet.getBalance());
    }

    /**
     * Deduct {@code amount} from the wallet of {@code userId}.
     * Throws {@link IllegalArgumentException} if balance is insufficient.
     * Returns the wallet balance after deduction.
     */
    @Transactional
    public BigDecimal deduct(Long userId, BigDecimal amount) {
        UserWallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Wallet not found for user: " + userId));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException(
                    "Insufficient wallet balance. Available: ₹"
                            + wallet.getBalance()
                            + ", Required: ₹" + amount);
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);
        return wallet.getBalance();
    }

    /**
     * Add (refund) {@code amount} to the wallet of {@code userId}.
     * Returns the wallet balance after refund.
     */
    @Transactional
    public BigDecimal refund(Long userId, BigDecimal amount) {
        UserWallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Wallet not found for user: " + userId));

        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
        return wallet.getBalance();
    }
}
