package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

import org.owasp.encoder.Encode;

public record StartTimeEntryRequest(
    @NotBlank(message = "Task description cannot be empty")
    @Size(max = 255, message = "Task description cannot exceed 255 characters")
    String description,

    @NotNull(message = "Start time is required")
    LocalDateTime startTime,

    @Size(max = 100, message = "Category cannot exceed 100 characters")
    String category,

    @Size(max = 10, message = "Maximum 10 tags allowed")
    List<Long> tagIds, // Changed from List<String> to List<Long>

    Long projectId,

    boolean billable
) {
    public Long getProjectId() {
        return projectId;
    }

    public List<Long> getTagIds() { // Updated return type
        return tagIds;
    }

    public String getDescription() {
        return description;
    }
}