// addTimeEntryRequest.java
package com.tushar.demo.timetracker.dto;

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
		  boolean billable
		) {}