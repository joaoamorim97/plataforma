package com.plataforma.business.dto;

public record HourDto(
        Long id,
        Integer dayOfWeek,
        String openingTime,
        String closingTime,
        boolean open
) {}
