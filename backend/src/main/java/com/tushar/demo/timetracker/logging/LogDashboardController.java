package com.tushar.demo.timetracker.logging;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST controller for admin dashboard log viewing and analysis.
 * Provides endpoints for querying logs, metrics, and health status.
 */
@RestController
@RequestMapping("/api/admin/logs")
public class LogDashboardController {

    private final ObjectMapper objectMapper;
    
    @Value("${LOG_FILE:logs/application.log}")
    private String logFilePath;

    public LogDashboardController() {
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Get dashboard summary with metrics and health status.
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(
            @RequestParam(defaultValue = "5") int minutes) {
        
        Instant cutoff = Instant.now().minus(minutes, ChronoUnit.MINUTES);
        List<Map<String, Object>> recentLogs = loadRecentLogs(cutoff);
        
        return ResponseEntity.ok(analyzeLogs(recentLogs, minutes));
    }

    /**
     * Query logs with filters.
     */
    @GetMapping("/query")
    public ResponseEntity<List<Map<String, Object>>> queryLogs(
            @RequestParam(required = false) String component,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String requestId,
            @RequestParam(required = false) String operation,
            @RequestParam(defaultValue = "100") int limit) {
        
        List<Map<String, Object>> allLogs = loadAllLogs();
        
        List<Map<String, Object>> filtered = allLogs.stream()
            .filter(log -> component == null || component.equals(log.get("component")))
            .filter(log -> level == null || level.equals(log.get("level")))
            .filter(log -> userId == null || userId.equals(log.get("userId")))
            .filter(log -> requestId == null || requestId.equals(log.get("requestId")))
            .filter(log -> operation == null || operation.equals(log.get("operation")))
            .sorted((a, b) -> {
                String tsA = (String) a.getOrDefault("timestamp", "");
                String tsB = (String) b.getOrDefault("timestamp", "");
                return tsB.compareTo(tsA); // Descending
            })
            .limit(limit)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(filtered);
    }

    /**
     * Get logs for a specific request (distributed trace).
     */
    @GetMapping("/trace/{requestId}")
    public ResponseEntity<List<Map<String, Object>>> getRequestTrace(
            @PathVariable String requestId) {
        
        List<Map<String, Object>> allLogs = loadAllLogs();
        
        List<Map<String, Object>> trace = allLogs.stream()
            .filter(log -> requestId.equals(log.get("requestId")))
            .sorted((a, b) -> {
                String tsA = (String) a.getOrDefault("timestamp", "");
                String tsB = (String) b.getOrDefault("timestamp", "");
                return tsA.compareTo(tsB); // Ascending for trace
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(trace);
    }

    /**
     * Get user activity summary.
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserActivity(
            @PathVariable String userId,
            @RequestParam(defaultValue = "100") int limit) {
        
        List<Map<String, Object>> allLogs = loadAllLogs();
        
        List<Map<String, Object>> userLogs = allLogs.stream()
            .filter(log -> userId.equals(log.get("userId")))
            .sorted((a, b) -> {
                String tsA = (String) a.getOrDefault("timestamp", "");
                String tsB = (String) b.getOrDefault("timestamp", "");
                return tsB.compareTo(tsA);
            })
            .limit(limit)
            .collect(Collectors.toList());
        
        // Calculate metrics
        long errorCount = userLogs.stream()
            .filter(log -> "ERROR".equals(log.get("level")))
            .count();
        
        Map<String, Long> operations = userLogs.stream()
            .collect(Collectors.groupingBy(
                log -> (String) log.getOrDefault("operation", "unknown"),
                Collectors.counting()
            ));
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("userId", userId);
        summary.put("activityCount", userLogs.size());
        summary.put("errorCount", errorCount);
        summary.put("operations", operations);
        summary.put("recentActivity", userLogs.subList(0, Math.min(10, userLogs.size())));
        
        return ResponseEntity.ok(summary);
    }

    /**
     * Get performance metrics.
     */
    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceMetrics(
            @RequestParam(defaultValue = "60") int minutes) {
        
        Instant cutoff = Instant.now().minus(minutes, ChronoUnit.MINUTES);
        List<Map<String, Object>> recentLogs = loadRecentLogs(cutoff);
        
        // Extract performance logs
        List<Long> durations = recentLogs.stream()
            .filter(log -> {
                Object metadata = log.get("metadata");
                if (metadata instanceof Map) {
                    return "performance".equals(((Map<?, ?>) metadata).get("metricType"));
                }
                return false;
            })
            .map(log -> (Long) log.getOrDefault("durationMs", 0L))
            .filter(d -> d > 0)
            .sorted()
            .collect(Collectors.toList());
        
        Map<String, Object> metrics = new HashMap<>();
        
        if (!durations.isEmpty()) {
            long sum = durations.stream().mapToLong(Long::longValue).sum();
            double avg = sum / (double) durations.size();
            long p95 = durations.get((int) (durations.size() * 0.95));
            long p99 = durations.get((int) (durations.size() * 0.99));
            long max = durations.get(durations.size() - 1);
            long min = durations.get(0);
            
            metrics.put("sampleCount", durations.size());
            metrics.put("avgMs", Math.round(avg * 100.0) / 100.0);
            metrics.put("p95Ms", p95);
            metrics.put("p99Ms", p99);
            metrics.put("maxMs", max);
            metrics.put("minMs", min);
        } else {
            metrics.put("sampleCount", 0);
        }
        
        return ResponseEntity.ok(metrics);
    }

    /**
     * Get recent errors.
     */
    @GetMapping("/errors")
    public ResponseEntity<List<Map<String, Object>>> getRecentErrors(
            @RequestParam(defaultValue = "5") int minutes) {
        
        Instant cutoff = Instant.now().minus(minutes, ChronoUnit.MINUTES);
        List<Map<String, Object>> allLogs = loadRecentLogs(cutoff);
        
        List<Map<String, Object>> errors = allLogs.stream()
            .filter(log -> "ERROR".equals(log.get("level")) || "WARN".equals(log.get("level")))
            .sorted((a, b) -> {
                String tsA = (String) a.getOrDefault("timestamp", "");
                String tsB = (String) b.getOrDefault("timestamp", "");
                return tsB.compareTo(tsA);
            })
            .limit(50)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(errors);
    }

    // Helper methods

    private List<Map<String, Object>> loadAllLogs() {
        List<Map<String, Object>> logs = new ArrayList<>();
        Path path = Paths.get(logFilePath);
        
        if (!Files.exists(path)) {
            return logs;
        }
        
        try (BufferedReader reader = new BufferedReader(new FileReader(path.toFile()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                try {
                    Map<String, Object> log = objectMapper.readValue(line, new TypeReference<>() {});
                    logs.add(log);
                } catch (Exception e) {
                    // Skip malformed lines
                }
            }
        } catch (IOException e) {
            // Log file not accessible
        }
        
        return logs;
    }

    private List<Map<String, Object>> loadRecentLogs(Instant cutoff) {
        return loadAllLogs().stream()
            .filter(log -> {
                String ts = (String) log.get("timestamp");
                if (ts == null) return false;
                try {
                    Instant logTime = Instant.parse(ts);
                    return logTime.isAfter(cutoff);
                } catch (Exception e) {
                    return false;
                }
            })
            .collect(Collectors.toList());
    }

    private Map<String, Object> analyzeLogs(List<Map<String, Object>> logs, int minutes) {
        Map<String, Object> result = new HashMap<>();
        
        // Count by level
        Map<String, Long> byLevel = logs.stream()
            .collect(Collectors.groupingBy(
                log -> (String) log.getOrDefault("level", "UNKNOWN"),
                Collectors.counting()
            ));
        
        // Count by component
        Map<String, Long> byComponent = logs.stream()
            .collect(Collectors.groupingBy(
                log -> (String) log.getOrDefault("component", "unknown"),
                Collectors.counting()
            ));
        
        // Error count
        long errorCount = byLevel.getOrDefault("ERROR", 0L);
        long warnCount = byLevel.getOrDefault("WARN", 0L);
        
        // Health status
        String healthStatus = "healthy";
        if (errorCount > 10) {
            healthStatus = "critical";
        } else if (errorCount > 0 || warnCount > 5) {
            healthStatus = "degraded";
        }
        
        // Top operations
        Map<String, Long> byOperation = logs.stream()
            .collect(Collectors.groupingBy(
                log -> (String) log.getOrDefault("operation", "unknown"),
                Collectors.counting()
            ));
        
        List<Map.Entry<String, Long>> topOperations = byOperation.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .collect(Collectors.toList());
        
        result.put("healthStatus", healthStatus);
        result.put("timeRange", minutes + " minutes");
        result.put("totalLogs", logs.size());
        result.put("byLevel", byLevel);
        result.put("byComponent", byComponent);
        result.put("topOperations", topOperations);
        result.put("generatedAt", Instant.now().toString());
        
        return result;
    }
}
