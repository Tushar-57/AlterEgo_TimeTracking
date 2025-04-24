package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

import org.owasp.encoder.Encode;

public record StopTimeEntryRequest(
    @NotBlank(message = "Task description cannot be empty")
    @Size(max = 255, message = "Task description cannot exceed 255 characters")
    String description,

    @NotNull(message = "End time is required")
    LocalDateTime endTime,
    @NotNull(message = "Start time is required")
    LocalDateTime startTime,

    @Size(max = 10, message = "Maximum 10 tags allowed")
    List<Long> tagIds,

//    @Size(max = 1, message = "Maximum 1 Concurrent project allowed for now !")
    Long projectId,

    boolean billable
    
) {
	@AssertTrue(message = "End time must be after start time")
    public boolean isEndTimeValid() {
        return endTime == null || endTime.isAfter(startTime);
    }
    public Long getProjectId() {
        return projectId;
    }

    public List<Long> getTagIds() {
        return tagIds;
    }

    public String getDescription() {
        return description;
    }
}