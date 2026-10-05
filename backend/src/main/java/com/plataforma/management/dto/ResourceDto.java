package com.plataforma.management.dto;

public record ResourceDto(
        Long id,
        String name,
        String kind,
        boolean active
) {}
