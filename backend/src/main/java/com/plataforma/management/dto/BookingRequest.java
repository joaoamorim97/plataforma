package com.plataforma.management.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Pedido de agendamento feito pelo próprio cliente a partir da página pública.
 * O cliente escolhe serviço, (opcionalmente) profissional, data e horário.
 * Nome/telefone do cliente são preenchidos pelo perfil, mas podem vir no corpo.
 */
public record BookingRequest(
        @NotBlank String date,     // YYYY-MM-DD
        @NotBlank String time,     // HH:mm
        Long serviceId,
        Long providerId,
        String clientName,
        String clientPhone,
        String notes
) {}
