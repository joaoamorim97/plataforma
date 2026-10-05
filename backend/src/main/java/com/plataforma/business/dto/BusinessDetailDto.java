package com.plataforma.business.dto;

import com.plataforma.common.BusinessCategory;

import java.util.List;

/** Full representation used on the public business page and owner dashboard. */
public record BusinessDetailDto(
        Long id,
        String ownerId,
        String name,
        BusinessCategory category,
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
        Double rating,
        Integer totalReviews,
        boolean active,
        Double distanceKm,
        boolean openNow,
        List<ServiceDto> services,
        List<ImageDto> images,
        List<HourDto> hours
) {}
