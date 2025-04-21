package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.*;

public record SignupRequest(
    @NotBlank String name,
    @NotBlank @Email String email,
    @Size(min = 6) String password
) {}
