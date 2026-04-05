package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmailVerificationConfirmRequest(
    @NotBlank @Email @Size(max = 254)
    String email,

    @NotBlank @Pattern(regexp = "^[0-9]{6}$")
    String code
) {}
