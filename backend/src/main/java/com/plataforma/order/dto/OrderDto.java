package com.plataforma.order.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderDto(
        Long id,
        Long businessId,
        String businessName,
        String clientName,
        String clientPhone,
        BigDecimal total,
        String status,
        String notes,
        String createdAt,
        List<OrderItemDto> items
) {}
