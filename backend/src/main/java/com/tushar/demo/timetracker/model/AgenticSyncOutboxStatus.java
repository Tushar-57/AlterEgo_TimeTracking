package com.tushar.demo.timetracker.model;

public enum AgenticSyncOutboxStatus {
    PENDING,
    RETRY,
    PROCESSING,
    SUCCESS,
    FAILED
}
