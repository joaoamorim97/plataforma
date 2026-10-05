package com.plataforma.management.dto;

import jakarta.validation.constraints.NotBlank;

public record AppointmentRequest(
        @NotBlank String date,   // YYYY-MM-DD
        @NotBlank String time,   // HH:mm
        @NotBlank String clientName,
        String clientPhone,
        Long providerId,
        Long resourceId,
        Long serviceId,
        String status,
        String notes
) {}
