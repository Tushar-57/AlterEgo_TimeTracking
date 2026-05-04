package com.tushar.demo.timetracker.model;

public enum AgenticSyncOutboxStatus {
    PENDING,
    RETRY,
    PROCESSING,
    SUCCESS,
    FAILED,
    /** Terminal: event was discarded because the referenced entity no longer exists or the remote operation is a no-op. Not retried and not counted as an actionable failure in UI. */
    DEAD
}
