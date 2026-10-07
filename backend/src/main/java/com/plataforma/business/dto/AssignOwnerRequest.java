package com.plataforma.business.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignOwnerRequest(
        @NotBlank String ownerEmail
) {}
