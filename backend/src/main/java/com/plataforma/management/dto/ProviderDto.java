package com.plataforma.management.dto;

public record ProviderDto(
        Long id,
        String name,
        String role,
        String phone,
        String avatarUrl,
        boolean active
) {}
