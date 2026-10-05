package com.plataforma.management.dto;

import java.math.BigDecimal;

/** Appointment enriched with the referenced names for display. */
public record AppointmentDto(
        Long id,
        String date,
        String time,
        String clientName,
        String clientPhone,
        Long providerId,
        String providerName,
        Long resourceId,
        String resourceName,
        Long serviceId,
        String serviceName,
        BigDecimal servicePrice,
        String status,
        String notes
) {}
