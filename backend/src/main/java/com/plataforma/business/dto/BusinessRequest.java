package com.plataforma.business.dto;

import com.plataforma.common.BusinessCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BusinessRequest(
        @NotBlank String name,
        @NotNull BusinessCategory category,
        String description,
        String phone,
        String whatsapp,
        String address,
        String addressNumber,
        String neighborhood,
        String city,
        String state,
        String postalCode,
        Double latitude,
        Double longitude,
        String coverImageUrl,
        Boolean active,
        /** E-mail do dono (usado pelo admin ao atribuir dono). Opcional. */
        String ownerEmail
) {}
