package com.plataforma.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record InventoryItemRequest(
        @NotBlank String name,
        String kind, // SUPPLY | RESALE
        @PositiveOrZero Integer quantity,
        @PositiveOrZero Integer minQuantity,
        @PositiveOrZero BigDecimal unitPrice
) {}
