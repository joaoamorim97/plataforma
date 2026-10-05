package com.plataforma.business.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record HourRequest(
        @NotNull @Min(0) @Max(6) Integer dayOfWeek,
        String openingTime,
        String closingTime,
        boolean open
) {}
