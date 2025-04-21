package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TagCreateRequest(
    @NotBlank(message = "Tag name is required")
    @Size(max = 50, message = "Tag name cannot exceed 50 characters")
    String name,

    @Size(max = 7, message = "Color must be a valid hex code")
    String color
) {}