package com.tushar.demo.timetracker.logging;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Utility for timing operations and logging performance metrics.
 */
public class PerformanceTimer {

    private static final Map<String, Long> timers = new ConcurrentHashMap<>();

    /**
     * Execute a function and time its execution.
     */
    public static <T> T time(String operation, LogComponent component, Supplier<T> function) {
        StructuredLogger logger = LoggingFactory.getComponentLogger(component);
        long startTime = System.currentTimeMillis();

        try {
            T result = function.get();
            long duration = System.currentTimeMillis() - startTime;
            logger.performance(operation, duration, "Operation completed successfully");
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.error(operation, "Operation failed after " + duration + "ms", Map.of(
                    "durationMs", duration,
                    "errorType", e.getClass().getSimpleName()
            ), e);
            throw e;
        }
    }

    /**
     * Execute a function and time its execution with additional metadata.
     */
    public static <T> T time(String operation, LogComponent component,
                             Map<String, Object> metadata, Supplier<T> function) {
        StructuredLogger logger = LoggingFactory.getComponentLogger(component);
        long startTime = System.currentTimeMillis();

        try {
            T result = function.get();
            long duration = System.currentTimeMillis() - startTime;
            logger.performance(operation, duration, "Operation completed successfully", metadata);
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            Map<String, Object> errorMetadata = new ConcurrentHashMap<>(metadata);
            errorMetadata.put("durationMs", duration);
            errorMetadata.put("errorType", e.getClass().getSimpleName());
            logger.error(operation, "Operation failed after " + duration + "ms", errorMetadata, e);
            throw e;
        }
    }

    /**
     * Start a timer for manual tracking.
     */
    public static void start(String timerId) {
        timers.put(timerId, System.currentTimeMillis());
    }

    /**
     * Stop a timer and return the duration in milliseconds.
     */
    public static long stop(String timerId) {
        Long startTime = timers.remove(timerId);
        if (startTime == null) {
            return -1;
        }
        return System.currentTimeMillis() - startTime;
    }

    /**
     * Stop a timer and log the result.
     */
    public static void stopAndLog(String timerId, String operation, LogComponent component) {
        long duration = stop(timerId);
        if (duration >= 0) {
            StructuredLogger logger = LoggingFactory.getComponentLogger(component);
            logger.performance(operation, duration, "Operation completed");
        }
    }

    /**
     * Clear all timers.
     */
    public static void clear() {
        timers.clear();
    }
}
