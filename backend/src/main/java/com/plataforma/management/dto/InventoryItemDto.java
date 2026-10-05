package com.plataforma.management.dto;

import java.math.BigDecimal;

public record InventoryItemDto(
        Long id,
        String name,
        String kind,
        int quantity,
        int minQuantity,
        BigDecimal unitPrice,
        boolean lowStock
) {}
