package com.plataforma.business.dto;

import jakarta.validation.constraints.NotBlank;

public record ImageRequest(
        @NotBlank String imageUrl,
        boolean cover
) {}
