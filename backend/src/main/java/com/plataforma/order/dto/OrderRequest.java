package com.plataforma.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

/** Checkout: carrinho com itens + dados de contato do cliente. */
public record OrderRequest(
        @NotEmpty List<@Valid Line> items,
        String clientName,
        String clientPhone,
        String notes
) {
    public record Line(
            @NotNull Long productId,
            @NotNull @Positive Integer quantity
    ) {}
}
