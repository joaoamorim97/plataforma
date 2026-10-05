package com.plataforma.management.dto;

import jakarta.validation.constraints.NotBlank;

public record ResourceRequest(
        @NotBlank String name,
        String kind,
        Boolean active
) {}
