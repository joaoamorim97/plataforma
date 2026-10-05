package com.plataforma.management.dto;

import jakarta.validation.constraints.NotBlank;

public record ProviderRequest(
        @NotBlank String name,
        String role,
        String phone,
        String avatarUrl,
        Boolean active
) {}
