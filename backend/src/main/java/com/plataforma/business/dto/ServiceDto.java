package com.plataforma.business.dto;

import java.math.BigDecimal;

public record ServiceDto(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Integer durationMinutes
) {}
