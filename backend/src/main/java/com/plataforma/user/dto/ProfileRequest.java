package com.plataforma.user.dto;

import com.plataforma.common.UserRole;
import jakarta.validation.constraints.NotBlank;

public record ProfileRequest(
        @NotBlank String name,
        String email,
        String phone,
        String avatarUrl,
        UserRole role
) {}
