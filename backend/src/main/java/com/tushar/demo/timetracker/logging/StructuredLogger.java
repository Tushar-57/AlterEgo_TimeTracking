package com.tushar.demo.timetracker.logging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Structured logger that outputs JSON-formatted logs with correlation IDs and user context.
 * Provides consistent logging format across the application.
 */
public class StructuredLogger {

    private final Logger logger;
    private final String component;
    private final ObjectMapper objectMapper;

    public StructuredLogger(Class<?> clazz) {
        this.logger = LoggerFactory.getLogger(clazz);
        this.component = LogComponent.fromClass(clazz).getValue();
        this.objectMapper = new ObjectMapper();
    }

    public StructuredLogger(String name) {
        this.logger = LoggerFactory.getLogger(name);
        this.component = LogComponent.SYSTEM.getValue();
        this.objectMapper = new ObjectMapper();
    }

    public StructuredLogger(String name, LogComponent component) {
        this.logger = LoggerFactory.getLogger(name);
        this.component = component.getValue();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Log a debug message.
     */
    public void debug(String operation, String message) {
        log("DEBUG", operation, message, null, null, null);
    }

    public void debug(String operation, String message, Map<String, Object> metadata) {
        log("DEBUG", operation, message, null, metadata, null);
    }

    /**
     * Log an info message.
     */
    public void info(String operation, String message) {
        log("INFO", operation, message, null, null, null);
    }

    public void info(String operation, String message, Map<String, Object> metadata) {
        log("INFO", operation, message, null, metadata, null);
    }

    /**
     * Log a warning message.
     */
    public void warn(String operation, String message) {
        log("WARN", operation, message, null, null, null);
    }

    public void warn(String operation, String message, Throwable throwable) {
        log("WARN", operation, message, null, null, throwable);
    }

    public void warn(String operation, String message, Map<String, Object> metadata) {
        log("WARN", operation, message, null, metadata, null);
    }

    /**
     * Log an error message.
     */
    public void error(String operation, String message) {
        log("ERROR", operation, message, null, null, null);
    }

    public void error(String operation, String message, Throwable throwable) {
        log("ERROR", operation, message, null, null, throwable);
    }

    public void error(String operation, String message, Map<String, Object> metadata, Throwable throwable) {
        log("ERROR", operation, message, null, metadata, throwable);
    }

    /**
     * Log a performance metric.
     */
    public void performance(String operation, long durationMs, String message) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("metricType", "performance");
        log("INFO", operation, message, durationMs, metadata, null);
    }

    public void performance(String operation, long durationMs, String message, Map<String, Object> additionalMetadata) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("metricType", "performance");
        if (additionalMetadata != null) {
            metadata.putAll(additionalMetadata);
        }
        log("INFO", operation, message, durationMs, metadata, null);
    }

    /**
     * Log a security-related event.
     */
    public void security(String operation, String message, Map<String, Object> metadata) {
        Map<String, Object> securityMetadata = new HashMap<>();
        securityMetadata.put("eventType", "security");
        if (metadata != null) {
            securityMetadata.putAll(metadata);
        }
        log("INFO", operation, message, null, securityMetadata, null);
    }

    /**
     * Log a security warning or alert.
     */
    public void securityWarn(String operation, String message, Map<String, Object> metadata) {
        Map<String, Object> securityMetadata = new HashMap<>();
        securityMetadata.put("eventType", "security");
        securityMetadata.put("severity", "warning");
        if (metadata != null) {
            securityMetadata.putAll(metadata);
        }
        log("WARN", operation, message, null, securityMetadata, null);
    }

    /**
     * Log an audit event.
     */
    public void audit(String operation, String message, Map<String, Object> metadata) {
        Map<String, Object> auditMetadata = new HashMap<>();
        auditMetadata.put("eventType", "audit");
        if (metadata != null) {
            auditMetadata.putAll(metadata);
        }
        log("INFO", operation, message, null, auditMetadata, null);
    }

    /**
     * Internal log method.
     */
    private void log(String level, String operation, String message, Long durationMs,
                     Map<String, Object> metadata, Throwable throwable) {
        // Build the structured log entry
        StructuredLogEntry.Builder builder = StructuredLogEntry.builder()
                .level(level)
                .component(LogComponent.valueOf(component.toUpperCase()))
                .operation(operation)
                .message(message)
                .requestId(LogContext.getRequestId())
                .userId(LogContext.getUserId());

        if (durationMs != null) {
            builder.durationMs(durationMs);
        }

        if (metadata != null) {
            metadata.forEach(builder::metadata);
        }

        if (throwable != null) {
            builder.error(throwable);
        }

        StructuredLogEntry entry = builder.build();

        // Convert to JSON
        String jsonLog;
        try {
            jsonLog = objectMapper.writeValueAsString(entry.toMap());
        } catch (JsonProcessingException e) {
            // Fallback to simple format if JSON fails
            jsonLog = String.format("{\"level\":\"%s\",\"component\":\"%s\",\"operation\":\"%s\",\"message\":\"%s\"}",
                    level, component, operation, message.replace("\"", "\\\""));
        }

        // Log via SLF4J
        switch (level) {
            case "DEBUG":
                if (throwable != null) {
                    logger.debug(jsonLog, throwable);
                } else {
                    logger.debug(jsonLog);
                }
                break;
            case "INFO":
                if (throwable != null) {
                    logger.info(jsonLog, throwable);
                } else {
                    logger.info(jsonLog);
                }
                break;
            case "WARN":
                if (throwable != null) {
                    logger.warn(jsonLog, throwable);
                } else {
                    logger.warn(jsonLog);
                }
                break;
            case "ERROR":
                if (throwable != null) {
                    logger.error(jsonLog, throwable);
                } else {
                    logger.error(jsonLog);
                }
                break;
            default:
                logger.info(jsonLog);
        }
    }

    // Factory methods for convenience

    public static StructuredLogger getLogger(Class<?> clazz) {
        return new StructuredLogger(clazz);
    }

    public static StructuredLogger getLogger(String name) {
        return new StructuredLogger(name);
    }

    public static StructuredLogger getLogger(String name, LogComponent component) {
        return new StructuredLogger(name, component);
    }

    public static StructuredLogger forComponent(LogComponent component) {
        return new StructuredLogger("app." + component.getValue(), component);
    }
}
