package com.tushar.demo.timetracker.logging;

/**
 * Component categories for log segregation.
 * Used to categorize logs by system component for filtering and analysis.
 */
public enum LogComponent {
    API("api"),
    AUTH("auth"),
    SERVICE("service"),
    REPOSITORY("repository"),
    ASSISTANT("assistant"),
    AI_AGENT("ai_agent"),
    SCHEDULER("scheduler"),
    ANALYTICS("analytics"),
    EMAIL("email"),
    SECURITY("security"),
    PERFORMANCE("performance"),
    SYSTEM("system");

    private final String value;

    LogComponent(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    /**
     * Infer component from class name or package.
     */
    public static LogComponent fromClass(Class<?> clazz) {
        String packageName = clazz.getPackage().getName();
        String className = clazz.getSimpleName().toLowerCase();

        if (packageName.contains("controller") || className.contains("controller")) {
            return API;
        }
        if (packageName.contains("config") && (className.contains("jwt") || className.contains("auth"))) {
            return AUTH;
        }
        if (packageName.contains("config")) {
            return SYSTEM;
        }
        if (packageName.contains("service") || className.contains("service")) {
            return SERVICE;
        }
        if (packageName.contains("repository") || className.contains("repository")) {
            return REPOSITORY;
        }
        if (packageName.contains("assistant")) {
            if (className.contains("agent") || className.contains("orchestrator")) {
                return AI_AGENT;
            }
            return ASSISTANT;
        }
        if (className.contains("scheduler") || className.contains("schedule")) {
            return SCHEDULER;
        }
        if (className.contains("analytics") || className.contains("analytic")) {
            return ANALYTICS;
        }
        if (className.contains("email") || className.contains("mail")) {
            return EMAIL;
        }
        if (className.contains("security") || className.contains("jwt") || className.contains("auth")) {
            return SECURITY;
        }

        return SERVICE;
    }
}
