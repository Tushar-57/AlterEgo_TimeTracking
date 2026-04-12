package com.tushar.demo.timetracker.logging;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Represents a structured log entry with standardized fields.
 * Designed for JSON serialization and machine parsing.
 */
public class StructuredLogEntry {

    private Instant timestamp;
    private String level;
    private String component;
    private String operation;
    private String message;
    private String requestId;
    private String userId;
    private Long durationMs;
    private Map<String, Object> metadata;
    private Map<String, Object> error;

    public StructuredLogEntry() {
        this.timestamp = Instant.now();
        this.metadata = new HashMap<>();
    }

    public StructuredLogEntry(
            Instant timestamp,
            String level,
            String component,
            String operation,
            String message,
            String requestId,
            String userId,
            Long durationMs,
            Map<String, Object> metadata,
            Map<String, Object> error) {
        this.timestamp = timestamp != null ? timestamp : Instant.now();
        this.level = level;
        this.component = component;
        this.operation = operation;
        this.message = message;
        this.requestId = requestId;
        this.userId = userId;
        this.durationMs = durationMs;
        this.metadata = metadata != null ? metadata : new HashMap<>();
        this.error = error;
    }

    // Builder pattern for convenience
    public static Builder builder() {
        return new Builder();
    }

    // Getters and setters
    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getComponent() {
        return component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Long getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Long durationMs) {
        this.durationMs = durationMs;
    }

    public Map<String, Object> getMetadata() {
        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
        this.metadata = metadata;
    }

    public Map<String, Object> getError() {
        return error;
    }

    public void setError(Map<String, Object> error) {
        this.error = error;
    }

    /**
     * Add a metadata field.
     */
    public void addMetadata(String key, Object value) {
        this.metadata.put(key, value);
    }

    /**
     * Convert to a map for JSON serialization.
     */
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("timestamp", timestamp.toString());
        map.put("level", level);
        map.put("component", component);
        map.put("operation", operation);
        map.put("message", message);
        if (requestId != null && !requestId.isEmpty()) {
            map.put("requestId", requestId);
        }
        if (userId != null && !userId.isEmpty()) {
            map.put("userId", userId);
        }
        if (durationMs != null) {
            map.put("durationMs", durationMs);
        }
        if (!metadata.isEmpty()) {
            map.put("metadata", metadata);
        }
        if (error != null && !error.isEmpty()) {
            map.put("error", error);
        }
        return map;
    }

    public static class Builder {
        private StructuredLogEntry entry = new StructuredLogEntry();

        public Builder level(String level) {
            entry.setLevel(level);
            return this;
        }

        public Builder component(String component) {
            entry.setComponent(component);
            return this;
        }

        public Builder component(LogComponent component) {
            entry.setComponent(component.getValue());
            return this;
        }

        public Builder operation(String operation) {
            entry.setOperation(operation);
            return this;
        }

        public Builder message(String message) {
            entry.setMessage(message);
            return this;
        }

        public Builder requestId(String requestId) {
            entry.setRequestId(requestId);
            return this;
        }

        public Builder userId(String userId) {
            entry.setUserId(userId);
            return this;
        }

        public Builder durationMs(Long durationMs) {
            entry.setDurationMs(durationMs);
            return this;
        }

        public Builder metadata(String key, Object value) {
            entry.addMetadata(key, value);
            return this;
        }

        public Builder error(String type, String message) {
            Map<String, Object> error = new HashMap<>();
            error.put("type", type);
            error.put("message", message);
            entry.setError(error);
            return this;
        }

        public Builder error(Throwable throwable) {
            Map<String, Object> error = new HashMap<>();
            error.put("type", throwable.getClass().getSimpleName());
            error.put("message", throwable.getMessage());
            entry.setError(error);
            return this;
        }

        public StructuredLogEntry build() {
            return entry;
        }
    }
}
