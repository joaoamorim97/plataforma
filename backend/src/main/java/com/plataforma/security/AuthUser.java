package com.plataforma.security;

/**
 * The authenticated user resolved from a Supabase access token.
 *
 * @param userId the Supabase user id (JWT "sub" claim)
 * @param email  the user email, when present in the token
 */
public record AuthUser(String userId, String email) {
}
