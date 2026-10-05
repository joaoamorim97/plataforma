package com.plataforma.business.dto;

import com.plataforma.common.BusinessCategory;

import java.math.BigDecimal;

/** Lightweight projection used in lists and map markers. */
public record BusinessSummaryDto(
        Long id,
        String name,
        BusinessCategory category,
        String neighborhood,
        String city,
        Double latitude,
        Double longitude,
        String coverImageUrl,
        Double rating,
        Integer totalReviews,
        Double distanceKm,
        BigDecimal startingPrice,
        boolean openNow
) {}
