package com.tushar.demo.timetracker.model;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;

@Entity
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true)
    private String email;
    private String password;
    
    @Column(name = "email_verified")
    private boolean emailVerified;
    private boolean tokenInvalidated = false;

    @Column(name = "token_version", columnDefinition = "bigint default 0")
    private Long tokenVersion = 0L;

    @Column(name = "password_reset_code_hash")
    private String passwordResetCodeHash;

    @Column(name = "password_reset_code_expires_at")
    private Instant passwordResetCodeExpiresAt;

    @Column(name = "password_reset_attempts")
    private int passwordResetAttempts = 0;

    @Column(name = "email_verification_code_hash")
    private String emailVerificationCodeHash;

    @Column(name = "email_verification_code_expires_at")
    private Instant emailVerificationCodeExpiresAt;

    @Column(name = "email_verification_attempts")
    private int emailVerificationAttempts = 0;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;
    
    @Column(name = "onboarding_completed")
    private boolean onboardingCompleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "timezone", nullable = false, updatable = false)
    private String timezone;

    @PrePersist
    protected void onCreate() {
        this.timezone = ZoneId.systemDefault().toString();
    }
   
    @OneToMany(mappedBy = "user")
    private List<TimeEntry> timeEntries;

    public String getEmail() {
        return email;
    }
    public boolean isTokenInvalidated() {
        return tokenInvalidated;
    }
    public void setTokenInvalidated(boolean tokenInvalidated) {
        this.tokenInvalidated = tokenInvalidated;
    }

    public long getTokenVersion() {
        return tokenVersion == null ? 0L : tokenVersion;
    }

    public void setTokenVersion(long tokenVersion) {
        this.tokenVersion = tokenVersion;
    }

    public String getPasswordResetCodeHash() {
        return passwordResetCodeHash;
    }

    public void setPasswordResetCodeHash(String passwordResetCodeHash) {
        this.passwordResetCodeHash = passwordResetCodeHash;
    }

    public Instant getPasswordResetCodeExpiresAt() {
        return passwordResetCodeExpiresAt;
    }

    public void setPasswordResetCodeExpiresAt(Instant passwordResetCodeExpiresAt) {
        this.passwordResetCodeExpiresAt = passwordResetCodeExpiresAt;
    }

    public int getPasswordResetAttempts() {
        return passwordResetAttempts;
    }

    public void setPasswordResetAttempts(int passwordResetAttempts) {
        this.passwordResetAttempts = passwordResetAttempts;
    }

    public String getEmailVerificationCodeHash() {
        return emailVerificationCodeHash;
    }

    public void setEmailVerificationCodeHash(String emailVerificationCodeHash) {
        this.emailVerificationCodeHash = emailVerificationCodeHash;
    }

    public Instant getEmailVerificationCodeExpiresAt() {
        return emailVerificationCodeExpiresAt;
    }

    public void setEmailVerificationCodeExpiresAt(Instant emailVerificationCodeExpiresAt) {
        this.emailVerificationCodeExpiresAt = emailVerificationCodeExpiresAt;
    }

    public int getEmailVerificationAttempts() {
        return emailVerificationAttempts;
    }

    public void setEmailVerificationAttempts(int emailVerificationAttempts) {
        this.emailVerificationAttempts = emailVerificationAttempts;
    }

    public Instant getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    public void setEmailVerifiedAt(Instant emailVerifiedAt) {
        this.emailVerifiedAt = emailVerifiedAt;
    }

    public String getPassword() {
        return password;
    }

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public void setPassword(String password) {
		this.password = password;
	}
	public String getTimezone() {
		return timezone;
	}
	public void setTimezone(String timezone) {
		this.timezone = timezone;
	}
	public boolean isEmailVerified() {
		return emailVerified;
	}
	public void setEmailVerified(boolean emailVerified) {
		this.emailVerified = emailVerified;
	}
	public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public void setOnboardingCompleted(boolean onboardingCompleted) {
        this.onboardingCompleted = onboardingCompleted;
    }
	public boolean isEnabled() {
		
		return true;
	}
}