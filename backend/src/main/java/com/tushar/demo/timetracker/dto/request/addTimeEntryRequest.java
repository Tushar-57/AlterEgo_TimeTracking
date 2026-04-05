package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public record addTimeEntryRequest(
		@NotBlank(message = "Task description cannot be empty") @Size(max = 255, message = "Task description cannot exceed 255 characters") String description,

		@NotNull(message = "Start time is required") LocalDateTime startTime,

		@NotNull(message = "End time is required") LocalDateTime endTime,

		@Size(max = 100, message = "Category cannot exceed 100 characters") String category,

//    @Size(max = 10, message = "Maximum 10 tags allowed")
		List<Long> tagIds,

//    @Size(max = 1, message = "Maximum 1 Concurrent project allowed for now !")
		Long projectId,

		boolean billable, String positionTop, String positionLeft,

		@Size(max = 255, message = "Linked goal cannot exceed 255 characters") String linkedGoal,
		@Min(value = 1, message = "Focus score must be at least 1") @Max(value = 10, message = "Focus score cannot exceed 10") Integer focusScore,
		@Min(value = 1, message = "Energy score must be at least 1") @Max(value = 10, message = "Energy score cannot exceed 10") Integer energyScore,
		@Size(max = 500, message = "Blockers cannot exceed 500 characters") String blockers,
		@Size(max = 2000, message = "Context notes cannot exceed 2000 characters") String contextNotes,
		@Size(max = 5000, message = "AI detail cannot exceed 5000 characters") String aiDetail)
{
	@AssertTrue(message = "End time must be after start time")
	public boolean isEndTimeValid() {
		return endTime != null && startTime != null && endTime.isAfter(startTime);
	}

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

	public String getLinkedGoal() {
		return linkedGoal;
	}

	public Integer getFocusScore() {
		return focusScore;
	}

	public Integer getEnergyScore() {
		return energyScore;
	}

	public String getBlockers() {
		return blockers;
	}

	public String getContextNotes() {
		return contextNotes;
	}

	public String getAiDetail() {
		return aiDetail;
	}
}