package com.plataforma.business.dto;

public record ImageDto(
        Long id,
        String imageUrl,
        boolean cover
) {}
