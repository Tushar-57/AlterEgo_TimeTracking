package com.tushar.demo.timetracker.dto.request;

import java.time.LocalDateTime;

public record TimeEntryUpdateRequest(
    Long id,
    LocalDateTime startTime,
    LocalDateTime endTime,
    String taskDescription,
    String category
) {}