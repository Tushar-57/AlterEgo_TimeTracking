package com.tushar.demo.timetracker.logging;

import java.util.HashMap;
import java.util.Map;

/**
 * Thread-local context for request correlation and user tracking.
 * Stores request ID, user ID, and other contextual data for log enrichment.
 */
public final class LogContext {

    private static final ThreadLocal<Map<String, String>> context = ThreadLocal.withInitial(HashMap::new);

    private LogContext() {
        // Utility class
    }

    /**
     * Set the request ID for the current thread.
     */
    public static void setRequestId(String requestId) {
        context.get().put("requestId", requestId);
    }

    /**
     * Get the request ID for the current thread.
     */
    public static String getRequestId() {
        return context.get().getOrDefault("requestId", "");
    }

    /**
     * Set the user ID for the current thread.
     */
    public static void setUserId(String userId) {
        context.get().put("userId", userId);
    }

    /**
     * Get the user ID for the current thread.
     */
    public static String getUserId() {
        return context.get().getOrDefault("userId", "");
    }

    /**
     * Set a custom context value.
     */
    public static void setValue(String key, String value) {
        context.get().put(key, value);
    }

    /**
     * Get a custom context value.
     */
    public static String getValue(String key) {
        return context.get().getOrDefault(key, "");
    }

    /**
     * Get all context values as a map.
     */
    public static Map<String, String> getAll() {
        return new HashMap<>(context.get());
    }

    /**
     * Clear all context for the current thread.
     * Should be called at the end of request processing.
     */
    public static void clear() {
        context.get().clear();
    }

    /**
     * Execute a runnable with a specific request ID.
     */
    public static void withRequestId(String requestId, Runnable runnable) {
        String previousRequestId = getRequestId();
        try {
            setRequestId(requestId);
            runnable.run();
        } finally {
            setRequestId(previousRequestId);
        }
    }

    /**
     * Execute a runnable with specific user and request context.
     */
    public static void withContext(String userId, String requestId, Runnable runnable) {
        String previousUserId = getUserId();
        String previousRequestId = getRequestId();
        try {
            setUserId(userId);
            setRequestId(requestId);
            runnable.run();
        } finally {
            setUserId(previousUserId);
            setRequestId(previousRequestId);
        }
    }
}
