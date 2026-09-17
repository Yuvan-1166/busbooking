package com.yuvan.busbooking.auth.entity;

/**
 * Enum for TOTP alternative authentication methods
 * Available options when primary authenticator app is unavailable
 */
public enum TotpAlternativeType {
    SMS("SMS"),
    EMAIL("Email"),
    BACKUP_CODE("Backup Code");

    private final String displayName;

    TotpAlternativeType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
