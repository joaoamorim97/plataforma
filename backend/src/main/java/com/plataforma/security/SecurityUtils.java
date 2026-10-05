package com.plataforma.security;

import com.plataforma.common.exception.ForbiddenException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Convenience accessors for the current authenticated user. */
public final class SecurityUtils {

    private SecurityUtils() {}

    public static AuthUser currentUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser user) {
            return user;
        }
        return null;
    }

    public static AuthUser requireUser() {
        AuthUser user = currentUserOrNull();
        if (user == null) {
            throw new ForbiddenException("Autenticação necessária.");
        }
        return user;
    }

    public static String currentUserId() {
        return requireUser().userId();
    }
}
