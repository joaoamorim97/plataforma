package com.plataforma.order.dto;

import java.math.BigDecimal;

public record OrderItemDto(
        Long id,
        Long inventoryId,
        String productName,
        BigDecimal unitPrice,
        int quantity,
        BigDecimal lineTotal
) {}
