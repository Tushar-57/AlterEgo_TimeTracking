package com.tushar.demo.timetracker.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;
    private static final long STALE_WINDOW_MILLIS = WINDOW_MILLIS * 5;

    private static final int SIGNUP_LIMIT = 6;
    private static final int LOGIN_LIMIT = 12;
    private static final int EMAIL_VERIFICATION_REQUEST_LIMIT = 6;
    private static final int EMAIL_VERIFICATION_CONFIRM_LIMIT = 10;
    private static final int PASSWORD_RESET_REQUEST_LIMIT = 6;
    private static final int PASSWORD_RESET_CONFIRM_LIMIT = 10;
    private static final int VALIDATE_LIMIT = 120;
    private static final int DEFAULT_LIMIT = 60;

    private final Map<String, FixedWindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/auth/")
                || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long now = System.currentTimeMillis();
        cleanupStaleCounters(now);

        String endpoint = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = resolveClientIp(request);
        int limit = resolveLimit(endpoint);
        String key = method + "|" + endpoint + "|" + clientIp;

        boolean allowed = incrementAndCheckAllowed(key, limit, now);
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Window-Seconds", String.valueOf(WINDOW_MILLIS / 1000));

        if (!allowed) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"RATE_LIMITED\",\"message\":\"Too many auth attempts. Please retry in a minute.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private int resolveLimit(String endpoint) {
        if (endpoint.endsWith("/signup")) {
            return SIGNUP_LIMIT;
        }
        if (endpoint.endsWith("/login")) {
            return LOGIN_LIMIT;
        }
        if (endpoint.endsWith("/email-verification/request")) {
            return EMAIL_VERIFICATION_REQUEST_LIMIT;
        }
        if (endpoint.endsWith("/email-verification/confirm")) {
            return EMAIL_VERIFICATION_CONFIRM_LIMIT;
        }
        if (endpoint.endsWith("/password-reset/request")) {
            return PASSWORD_RESET_REQUEST_LIMIT;
        }
        if (endpoint.endsWith("/password-reset/confirm")) {
            return PASSWORD_RESET_CONFIRM_LIMIT;
        }
        if (endpoint.endsWith("/validate")) {
            return VALIDATE_LIMIT;
        }
        return DEFAULT_LIMIT;
    }

    private boolean incrementAndCheckAllowed(String key, int limit, long now) {
        FixedWindowCounter counter = counters.computeIfAbsent(key, ignored -> new FixedWindowCounter(now));

        synchronized (counter) {
            if (now - counter.windowStartMs >= WINDOW_MILLIS) {
                counter.windowStartMs = now;
                counter.requestCount.set(0);
            }

            int updatedCount = counter.requestCount.incrementAndGet();
            return updatedCount <= limit;
        }
    }

    private void cleanupStaleCounters(long now) {
        if (counters.size() < 10_000) {
            return;
        }

        counters.entrySet().removeIf(entry -> now - entry.getValue().windowStartMs > STALE_WINDOW_MILLIS);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private static class FixedWindowCounter {
        private final AtomicInteger requestCount;
        private long windowStartMs;

        private FixedWindowCounter(long windowStartMs) {
            this.windowStartMs = windowStartMs;
            this.requestCount = new AtomicInteger(0);
        }
    }
}
