package com.plataforma.management.dto;

/** Um horário possível no dia e se está disponível para agendamento. */
public record SlotDto(
        String time,
        boolean available
) {}
