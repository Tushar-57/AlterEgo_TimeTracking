// addTimeEntryRequest.java
package com.tushar.demo.timetracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public record StartTimeEntryRequest(
		
		  @NotBlank String taskDescription,
		  @NotNull LocalDateTime startTime,
		  String category,
		  List<String> tags,
		  Integer projectId,
		  boolean billable
		) {}