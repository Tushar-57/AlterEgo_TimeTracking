package com.tushar.demo.timetracker.logging;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Factory for creating and caching structured loggers.
 * Provides efficient logger lookup and reuse.
 */
public class LoggingFactory {

    private static final Map<String, StructuredLogger> loggerCache = new ConcurrentHashMap<>();

    /**
     * Get or create a structured logger for a class.
     * Loggers are cached for reuse.
     */
    public static StructuredLogger getLogger(Class<?> clazz) {
        String key = clazz.getName();
        return loggerCache.computeIfAbsent(key, k -> new StructuredLogger(clazz));
    }

    /**
     * Get or create a structured logger with a specific name.
     */
    public static StructuredLogger getLogger(String name) {
        return loggerCache.computeIfAbsent(name, StructuredLogger::new);
    }

    /**
     * Get or create a structured logger with a specific component.
     */
    public static StructuredLogger getLogger(String name, LogComponent component) {
        String key = name + ":" + component.getValue();
        return loggerCache.computeIfAbsent(key, k -> new StructuredLogger(name, component));
    }

    /**
     * Get a component-specific logger.
     */
    public static StructuredLogger getComponentLogger(LogComponent component) {
        String key = "component:" + component.getValue();
        return loggerCache.computeIfAbsent(key, k -> StructuredLogger.forComponent(component));
    }

    /**
     * Get API component logger.
     */
    public static StructuredLogger getApiLogger() {
        return getComponentLogger(LogComponent.API);
    }

    /**
     * Get Service component logger.
     */
    public static StructuredLogger getServiceLogger() {
        return getComponentLogger(LogComponent.SERVICE);
    }

    /**
     * Get Repository component logger.
     */
    public static StructuredLogger getRepositoryLogger() {
        return getComponentLogger(LogComponent.REPOSITORY);
    }

    /**
     * Get AI Agent component logger.
     */
    public static StructuredLogger getAiAgentLogger() {
        return getComponentLogger(LogComponent.AI_AGENT);
    }

    /**
     * Get Security component logger.
     */
    public static StructuredLogger getSecurityLogger() {
        return getComponentLogger(LogComponent.SECURITY);
    }

    /**
     * Get System component logger.
     */
    public static StructuredLogger getSystemLogger() {
        return getComponentLogger(LogComponent.SYSTEM);
    }

    /**
     * Clear the logger cache.
     * Useful for testing or reloading configurations.
     */
    public static void clearCache() {
        loggerCache.clear();
    }

    /**
     * Get cache statistics.
     */
    public static Map<String, Object> getCacheStats() {
        return Map.of(
                "cachedLoggers", loggerCache.size(),
                "cacheKeys", loggerCache.keySet()
        );
    }
}
