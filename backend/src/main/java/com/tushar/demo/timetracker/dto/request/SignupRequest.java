package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.*;

public record SignupRequest(
    @NotBlank
    @Size(min = 2, max = 80)
    @Pattern(regexp = "^[\\p{L}][\\p{L} .'-]{1,79}$", message = "Name contains invalid characters")
    String name,

    @NotBlank
    @Email
    @Size(max = 254)
    String email,

    @NotBlank
    @Size(min = 12, max = 128)
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$",
        message = "Password must include uppercase, lowercase, number, and special character"
    )
    String password
) {}
