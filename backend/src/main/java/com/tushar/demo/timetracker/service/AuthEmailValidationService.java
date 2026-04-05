package com.tushar.demo.timetracker.service;

import jakarta.annotation.PostConstruct;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.Hashtable;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthEmailValidationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthEmailValidationService.class);

    private static final Set<String> DEFAULT_BLOCKED_DOMAINS = Set.of(
        "mailinator.com",
        "tempmail.com",
        "10minutemail.com",
        "guerrillamail.com",
        "yopmail.com"
    );

    @Value("${app.auth.signup.mx-check-enabled:true}")
    private boolean mxCheckEnabled;

    @Value("${app.auth.signup.require-mx-record:true}")
    private boolean requireMxRecord;

    @Value("${app.auth.signup.mx-check-fail-open:true}")
    private boolean mxCheckFailOpen;

    @Value("${app.auth.signup.mx-timeout-ms:2000}")
    private int mxTimeoutMs;

    @Value("${app.auth.signup.allowed-domains:}")
    private String allowedDomainsProperty;

    @Value("${app.auth.signup.blocked-domains:}")
    private String blockedDomainsProperty;

    private Set<String> allowedDomains = Collections.emptySet();
    private Set<String> blockedDomains = DEFAULT_BLOCKED_DOMAINS;

    @PostConstruct
    public void initDomainLists() {
        Set<String> configuredAllowed = parseCsvDomains(allowedDomainsProperty);
        Set<String> configuredBlocked = parseCsvDomains(blockedDomainsProperty);

        this.allowedDomains = configuredAllowed;
        if (!configuredBlocked.isEmpty()) {
            this.blockedDomains = configuredBlocked;
        }
    }

    public ValidationResult validateForSignup(String email) {
        String domain = extractDomain(email);
        if (domain == null) {
            return ValidationResult.failure("INVALID_EMAIL_DOMAIN");
        }

        if (!allowedDomains.isEmpty() && !allowedDomains.contains(domain)) {
            return ValidationResult.failure("EMAIL_DOMAIN_NOT_ALLOWED");
        }

        if (blockedDomains.contains(domain)) {
            return ValidationResult.failure("DISPOSABLE_EMAIL_DOMAIN");
        }

        if (!mxCheckEnabled) {
            return ValidationResult.success();
        }

        try {
            if (hasDnsRecord(domain, "MX")) {
                return ValidationResult.success();
            }

            if (!requireMxRecord && hasDnsRecord(domain, "A")) {
                return ValidationResult.success();
            }

            return ValidationResult.failure("EMAIL_DOMAIN_HAS_NO_MX");
        } catch (NamingException ex) {
            logger.warn("MX lookup failed for domain {}: {}", domain, ex.getMessage());
            if (mxCheckFailOpen) {
                return ValidationResult.success();
            }
            return ValidationResult.failure("EMAIL_DOMAIN_LOOKUP_FAILED");
        }
    }

    private boolean hasDnsRecord(String domain, String recordType) throws NamingException {
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("com.sun.jndi.dns.timeout.initial", String.valueOf(mxTimeoutMs));
        env.put("com.sun.jndi.dns.timeout.retries", "1");

        DirContext context = null;
        try {
            context = new InitialDirContext(env);
            Attributes attributes = context.getAttributes(domain, new String[] { recordType });
            Attribute attribute = attributes.get(recordType);
            return attribute != null && attribute.size() > 0;
        } finally {
            if (context != null) {
                context.close();
            }
        }
    }

    private String extractDomain(String email) {
        if (email == null) {
            return null;
        }

        String normalized = email.trim().toLowerCase(Locale.ROOT);
        int separator = normalized.lastIndexOf('@');
        if (separator <= 0 || separator >= normalized.length() - 1) {
            return null;
        }

        String domain = normalized.substring(separator + 1);
        if (!domain.matches("^[a-z0-9.-]+\\.[a-z]{2,}$")) {
            return null;
        }

        return domain;
    }

    private Set<String> parseCsvDomains(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptySet();
        }

        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .map(value -> value.toLowerCase(Locale.ROOT))
            .filter(value -> !value.isEmpty())
            .collect(Collectors.toSet());
    }

    public record ValidationResult(boolean isValid, String errorCode) {
        public static ValidationResult success() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult failure(String errorCode) {
            return new ValidationResult(false, errorCode);
        }
    }
}
