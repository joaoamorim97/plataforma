package com.plataforma.management.dto;

import java.math.BigDecimal;

/** Agendamento do cliente, enriquecido com dados do negócio para a tela "Meus agendamentos". */
public record MyBookingDto(
        Long id,
        Long businessId,
        String businessName,
        String businessCategory,
        String businessPhone,
        String businessWhatsapp,
        String date,
        String time,
        Long serviceId,
        String serviceName,
        BigDecimal servicePrice,
        Long providerId,
        String providerName,
        String status
) {}
