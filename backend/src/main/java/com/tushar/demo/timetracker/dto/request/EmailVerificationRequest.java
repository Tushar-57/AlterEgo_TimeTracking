package com.tushar.demo.timetracker.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailVerificationRequest(
    @NotBlank @Email @Size(max = 254)
    String email
) {}
