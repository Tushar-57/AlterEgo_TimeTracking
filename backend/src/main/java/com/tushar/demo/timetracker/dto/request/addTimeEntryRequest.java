// addTimeEntryRequest.java
package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public record addTimeEntryRequest(
		
		  @NotBlank String taskDescription,
		  @NotNull LocalDateTime startTime,
		  LocalDateTime endTime,
		  String category,
		  List<String> tags,
		  Integer projectId,
		  boolean billable,
		  boolean isActive
		) {

	public String taskDescription() {
		return taskDescription;
	}

	public LocalDateTime startTime() {
		return startTime;
	}

	public LocalDateTime endTime() {
		return endTime;
	}

	public String category() {
		return category;
	}

	public List<String> tags() {
		return tags;
	}

	public Integer projectId() {
		return projectId;
	}

	public boolean billable() {
		return billable;
	}

	public boolean isActive() {
		return isActive;
	}
	
	
	
}