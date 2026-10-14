package com.plataforma.order.dto;

import java.math.BigDecimal;

/** Produto de revenda exposto publicamente na página do negócio. */
public record ProductDto(
        Long id,
        String name,
        BigDecimal unitPrice,
        int available // quantidade em estoque
) {}
