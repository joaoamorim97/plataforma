package com.plataforma.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Validates Supabase access tokens (HS256 signed with the project JWT secret).
 *
 * When no JWT secret is configured, the signature check is skipped and the token
 * payload is simply decoded. This is a development convenience only; always
 * configure SUPABASE_JWT_SECRET in production.
 */
@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(SupabaseJwtFilter.class);

    private final SecretKey key;
    private final boolean verifySignature;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SupabaseJwtFilter(@Value("${app.supabase.jwt-secret:}") String jwtSecret) {
        if (StringUtils.hasText(jwtSecret)) {
            this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            this.verifySignature = true;
        } else {
            this.key = null;
            this.verifySignature = false;
            log.warn("SUPABASE_JWT_SECRET is not set. JWT signatures will NOT be verified (dev mode).");
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            try {
                AuthUser principal = resolve(token);
                if (principal != null && StringUtils.hasText(principal.userId())) {
                    var authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception ex) {
                log.debug("Rejected invalid JWT: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(request, response);
    }

    private AuthUser resolve(String token) throws IOException {
        if (verifySignature) {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .clockSkewSeconds(60)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return new AuthUser(claims.getSubject(), claims.get("email", String.class));
        }
        return decodePayloadUnsafe(token);
    }

    /** Dev mode: decode the JWT payload (middle segment) without verifying the signature. */
    @SuppressWarnings("unchecked")
    private AuthUser decodePayloadUnsafe(String token) throws IOException {
        String[] parts = token.split("\\.");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Malformed JWT");
        }
        byte[] payload = Base64.getUrlDecoder().decode(parts[1]);
        Map<String, Object> map = objectMapper.readValue(payload, Map.class);
        Object sub = map.get("sub");
        Object email = map.get("email");
        return new AuthUser(sub == null ? null : sub.toString(),
                email == null ? null : email.toString());
    }
}
