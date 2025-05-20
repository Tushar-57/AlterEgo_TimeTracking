package com.tushar.demo.timetracker.model;

import java.time.Instant;
import java.time.LocalDateTime;
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