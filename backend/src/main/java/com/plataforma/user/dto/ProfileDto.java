package com.plataforma.user.dto;

import com.plataforma.common.UserRole;

public record ProfileDto(
        Long id,
        String userId,
        String name,
        String email,
        String phone,
        String avatarUrl,
        UserRole role
) {}
