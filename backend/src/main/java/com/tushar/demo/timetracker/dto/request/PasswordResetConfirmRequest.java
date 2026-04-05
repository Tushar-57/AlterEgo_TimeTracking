package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordResetConfirmRequest(
    @NotBlank
    @Email
    @Size(max = 254)
    String email,

    @NotBlank
    @Pattern(regexp = "^[0-9]{6}$", message = "Code must be a 6-digit number")
    String code,

    @NotBlank
    @Size(min = 12, max = 128)
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$",
        message = "Password must include uppercase, lowercase, number, and special character"
    )
    String newPassword
) {}
