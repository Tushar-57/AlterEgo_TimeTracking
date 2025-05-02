package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

import org.owasp.encoder.Encode;

public record addTimeEntryRequest(
		@NotBlank(message = "Task description cannot be empty") @Size(max = 255, message = "Task description cannot exceed 255 characters") String description,

		@NotNull(message = "Start time is required") LocalDateTime startTime,

		@NotNull(message = "End time is required") LocalDateTime endTime,

		@Size(max = 100, message = "Category cannot exceed 100 characters") String category,

//    @Size(max = 10, message = "Maximum 10 tags allowed")
		List<Long> tagIds,

//    @Size(max = 1, message = "Maximum 1 Concurrent project allowed for now !")
		Long projectId,

		boolean billable, String positionTop, String positionLeft)
{
	public String getDescription() {
		return description;
	}

	public @NotNull(message = "Start time is required") LocalDateTime getStartTime() {
		return startTime;
	}

	public @NotNull(message = "End time is required") LocalDateTime getEndTime() {
		return endTime;
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

	public String getPositionLeft() {
		return positionLeft;
	}
	public String getPositionTop() {
		return positionTop;
	}
}