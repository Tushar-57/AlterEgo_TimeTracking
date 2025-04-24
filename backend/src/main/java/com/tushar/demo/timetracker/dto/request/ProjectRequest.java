package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
 @NotBlank(message = "Project name is required")
 @Size(max = 100, message = "Project name cannot exceed 100 characters")
 String name,
 
 @Size(max = 7, message = "Color must be a valid hex code")
 String color,
 
 @Size(max = 100, message = "Client name cannot exceed 100 characters")
 String client
) {}