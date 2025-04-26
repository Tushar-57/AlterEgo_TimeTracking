package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

import org.owasp.encoder.Encode;

public record StartTimeEntryRequest(
		@NotBlank(message = "Task description cannot be empty") @Size(max = 255, message = "Task description cannot exceed 255 characters") String description,

		@NotNull(message = "Start time is required") LocalDateTime startTime,

		@Size(max = 100, message = "Category cannot exceed 100 characters") String category,

//    @Size(max = 10, message = "Maximum 10 tags allowed")
		List<Long> tagIds,

//    @Size(max = 1, message = "Maximum 1 Concurrent project allowed for now !")
		Long projectId,

		boolean billable) {
	public String getDescription() {
		return description;
	}

	public @NotNull(message = "Start time is required") LocalDateTime getStartTime() {
		return startTime;
	}

	public Long getProjectId() {
		return projectId;
	}

	public List<Long> getTagIds() {
		return tagIds;
	}

	public boolean isBillable() {
		return billable;
	}
}