package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PositionUpdateRequest(
    @NotBlank(message = "Position top is required")
    String positionTop,

    @NotBlank(message = "Position left is required")
    String positionLeft
) {}