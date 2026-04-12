package com.tushar.demo.timetracker.logging;

import ch.qos.logback.classic.PatternLayout;
import ch.qos.logback.classic.spi.ILoggingEvent;

/**
 * Beautiful colored pattern layout with visual separators and component-based coloring.
 * Features:
 * - Full color coding for all log components
 * - Visual separators (│, →)
 * - Component-based coloring
 * - Request correlation and user context
 */
public class ColoredPatternLayout extends PatternLayout {
    
    @Override
    public String doLayout(ILoggingEvent event) {
        StringBuilder sb = new StringBuilder();
        
        // Timestamp - dim gray
        sb.append("\033[38;5;240m");
        sb.append(String.format("%tT", event.getTimeStamp()));
        sb.append("\033[0m ");
        
        // Separator
        sb.append("\033[38;5;238m│\033[0m ");
        
        // Level with color
        String levelColor = getLevelColor(event.getLevel().toString());
        sb.append(levelColor);
        sb.append(String.format("%-8s", event.getLevel()));
        sb.append("\033[0m ");
        
        // Separator
        sb.append("\033[38;5;238m│\033[0m ");
        
        // Logger name with component color
        String loggerName = event.getLoggerName();
        String shortLogger = loggerName.substring(loggerName.lastIndexOf('.') + 1);
        if (shortLogger.length() > 12) {
            shortLogger = shortLogger.substring(0, 12);
        }
        String compColor = getComponentColor(loggerName);
        sb.append(compColor);
        sb.append(String.format("%-12s", shortLogger));
        sb.append("\033[0m ");
        
        // Separator
        sb.append("\033[38;5;238m│\033[0m ");
        
        // Request ID (dim)
        String requestId = LogContext.getRequestId();
        if (requestId == null || requestId.isEmpty()) {
            requestId = "unknown";
        } else if (requestId.length() > 8) {
            requestId = requestId.substring(0, 8);
        }
        sb.append("\033[38;5;240mreq:").append(requestId).append("\033[0m ");
        
        // Separator
        sb.append("\033[38;5;238m│\033[0m ");
        
        // User ID (dim)
        String userId = LogContext.getUserId();
        if (userId == null || userId.isEmpty()) {
            userId = "system";
        } else if (userId.length() > 12) {
            userId = userId.substring(0, 12);
        }
        sb.append("\033[38;5;240musr:").append(userId).append("\033[0m ");
        
        // Separator with arrow
        sb.append("\033[38;5;238m│→\033[0m ");
        
        // Message (bold)
        sb.append("\033[1m").append(event.getFormattedMessage()).append("\033[0m");
        
        // Duration if present in MDC
        String duration = LogContext.getValue("durationMs");
        if (duration != null && !duration.isEmpty()) {
            try {
                double dur = Double.parseDouble(duration);
                String durColor;
                if (dur < 100) {
                    durColor = "\033[38;5;82m";   // Green
                } else if (dur < 500) {
                    durColor = "\033[38;5;214m";  // Orange
                } else {
                    durColor = "\033[38;5;196m";  // Red
                }
                sb.append(" ").append(durColor).append("(").append(String.format("%.1f", dur)).append("ms)\033[0m");
            } catch (NumberFormatException e) {
                // Ignore invalid duration
            }
        }
        
        // Exception if present
        if (event.getThrowableProxy() != null) {
            sb.append("\n");
            sb.append("\033[38;5;196m✗ ").append(event.getThrowableProxy().getClassName())
              .append(": ").append(event.getThrowableProxy().getMessage()).append("\033[0m");
        }
        
        sb.append("\n");
        return sb.toString();
    }
    
    private String getLevelColor(String level) {
        return switch (level) {
            case "DEBUG" -> "\033[38;5;245m";      // Gray
            case "INFO" -> "\033[38;5;82m\033[1m"; // Bright Green Bold
            case "WARN" -> "\033[38;5;214m\033[1m"; // Orange Bold
            case "ERROR" -> "\033[38;5;196m\033[1m"; // Bright Red Bold
            case "TRACE" -> "\033[38;5;240m";     // Dim
            default -> "\033[0m";
        };
    }
    
    private String getComponentColor(String loggerName) {
        if (loggerName.contains("Controller")) {
            return "\033[38;5;208m";   // Orange
        } else if (loggerName.contains("Service")) {
            return "\033[38;5;117m";   // Light blue
        } else if (loggerName.contains("Repository") || loggerName.contains("DAO")) {
            return "\033[38;5;141m";   // Purple
        } else if (loggerName.contains("Agent")) {
            return "\033[38;5;183m";   // Light purple
        } else if (loggerName.contains("Sync")) {
            return "\033[38;5;79m";    // Sea green
        } else if (loggerName.contains("Security")) {
            return "\033[38;5;203m";   // Salmon
        } else if (loggerName.contains("Config")) {
            return "\033[38;5;228m";   // Light yellow
        } else {
            return "\033[38;5;250m";   // Light gray
        }
    }
}
