package com.plataforma.review.dto;

import java.time.Instant;

public record ReviewDto(
        Long id,
        Long businessId,
        String userId,
        Integer rating,
        String comment,
        Instant createdAt
) {}
