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
 * Valida os access tokens do Supabase.
 *
 * <p>O Supabase emite tokens assinados com:
 * <ul>
 *   <li><b>Chaves assimétricas</b> (ES256/RS256) — padrão novo. A assinatura é
 *       verificada com a chave pública obtida do JWKS do projeto
 *       (resolvida por "kid" via {@link SupabaseKeyLocator}).</li>
 *   <li><b>HS256</b> (segredo compartilhado legado) — verificado com o
 *       {@code SUPABASE_JWT_SECRET}, quando configurado.</li>
 * </ul>
 *
 * <p>Quando nenhuma forma de verificação está disponível, o payload é apenas
 * decodificado sem checar a assinatura. Isso é uma conveniência de
 * desenvolvimento; em produção configure o JWKS (project ref) e/ou o
 * SUPABASE_JWT_SECRET.
 */
@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(SupabaseJwtFilter.class);

    private final SecretKey hs256Key;
    private final boolean hs256Enabled;
    private final SupabaseKeyLocator keyLocator;
    private final boolean jwksEnabled;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SupabaseJwtFilter(
            @Value("${app.supabase.jwt-secret:}") String jwtSecret,
            @Value("${app.supabase.jwks-url:}") String jwksUrl) {

        if (StringUtils.hasText(jwtSecret)) {
            this.hs256Key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            this.hs256Enabled = true;
        } else {
            this.hs256Key = null;
            this.hs256Enabled = false;
        }

        if (StringUtils.hasText(jwksUrl)) {
            this.keyLocator = new SupabaseKeyLocator(jwksUrl.trim());
            this.jwksEnabled = true;
        } else {
            this.keyLocator = null;
            this.jwksEnabled = false;
        }

        if (!hs256Enabled && !jwksEnabled) {
            log.warn("Nem SUPABASE_JWT_SECRET nem JWKS configurados. "
                    + "As assinaturas dos JWT NÃO serão verificadas (modo dev).");
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
                log.debug("JWT rejeitado: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(request, response);
    }

    private AuthUser resolve(String token) throws IOException {
        String alg = algorithmOf(token);

        // Tokens assimétricos (ES256/RS256/ES512/RS512...) -> verifica via JWKS.
        if (jwksEnabled && alg != null && !alg.startsWith("HS")) {
            Claims claims = Jwts.parser()
                    .keyLocator(keyLocator)
                    .clockSkewSeconds(60)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return toAuthUser(claims);
        }

        // Tokens HS256 (segredo compartilhado legado).
        if (hs256Enabled && (alg == null || alg.startsWith("HS"))) {
            Claims claims = Jwts.parser()
                    .verifyWith(hs256Key)
                    .clockSkewSeconds(60)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return toAuthUser(claims);
        }

        // Sem verificador compatível configurado: modo dev (sem checar assinatura).
        if (!hs256Enabled && !jwksEnabled) {
            return decodePayloadUnsafe(token);
        }

        throw new IllegalStateException("Nenhum verificador compatível para o algoritmo do token: " + alg);
    }

    private AuthUser toAuthUser(Claims claims) {
        return new AuthUser(claims.getSubject(), claims.get("email", String.class));
    }

    /** Lê o campo "alg" do header do JWT (primeiro segmento) sem verificar a assinatura. */
    @SuppressWarnings("unchecked")
    private String algorithmOf(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                return null;
            }
            byte[] headerBytes = Base64.getUrlDecoder().decode(parts[0]);
            Map<String, Object> header = objectMapper.readValue(headerBytes, Map.class);
            Object alg = header.get("alg");
            return alg == null ? null : alg.toString();
        } catch (Exception ex) {
            return null;
        }
    }

    /** Modo dev: decodifica o payload (segmento do meio) sem verificar a assinatura. */
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
