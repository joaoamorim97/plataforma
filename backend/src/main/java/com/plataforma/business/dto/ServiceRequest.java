package com.plataforma.business.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ServiceRequest(
        @NotBlank String name,
        String description,
        @PositiveOrZero BigDecimal price,
        @PositiveOrZero Integer durationMinutes
) {}
