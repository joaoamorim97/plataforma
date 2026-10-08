package com.plataforma.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.LocatorAdapter;
import io.jsonwebtoken.ProtectedHeader;
import io.jsonwebtoken.security.Jwk;
import io.jsonwebtoken.security.JwkSet;
import io.jsonwebtoken.security.Jwks;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.Key;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Resolve a chave pública (por "kid") usada para assinar os access tokens do
 * Supabase, buscando o JWKS em:
 *   https://<project_ref>.supabase.co/auth/v1/.well-known/jwks.json
 *
 * As chaves são cacheadas em memória. Quando um "kid" desconhecido aparece
 * (ex.: após rotação de chaves no Supabase), o JWKS é recarregado uma vez.
 *
 * Suporta chaves assimétricas (ES256/RS256), que é o padrão novo do Supabase.
 * Tokens HS256 (segredo compartilhado legado) continuam sendo tratados pelo
 * SupabaseJwtFilter, pois a chave simétrica não é exposta pelo JWKS.
 */
public class SupabaseKeyLocator extends LocatorAdapter<Key> {

    private static final Logger log = LoggerFactory.getLogger(SupabaseKeyLocator.class);

    private final String jwksUrl;
    private final HttpClient httpClient;
    private final Map<String, Key> keysByKid = new ConcurrentHashMap<>();
    private volatile long lastFetchEpochMs = 0L;

    // Evita recarregar o JWKS em excesso quando chegam muitos tokens com kid inválido.
    private static final long MIN_REFRESH_INTERVAL_MS = 60_000L;

    public SupabaseKeyLocator(String jwksUrl) {
        this.jwksUrl = jwksUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    protected Key locate(ProtectedHeader header) {
        String kid = header.getKeyId();
        if (!StringUtils.hasText(kid)) {
            return null; // Sem kid não dá para resolver uma chave assimétrica.
        }

        Key cached = keysByKid.get(kid);
        if (cached != null) {
            return cached;
        }

        // kid desconhecido: tenta recarregar o JWKS (respeitando o intervalo mínimo).
        refreshIfAllowed();
        return keysByKid.get(kid);
    }

    private synchronized void refreshIfAllowed() {
        long now = System.currentTimeMillis();
        if (now - lastFetchEpochMs < MIN_REFRESH_INTERVAL_MS && !keysByKid.isEmpty()) {
            return;
        }
        try {
            loadJwks();
            lastFetchEpochMs = now;
        } catch (Exception ex) {
            log.warn("Falha ao carregar JWKS do Supabase ({}): {}", jwksUrl, ex.getMessage());
        }
    }

    private void loadJwks() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(jwksUrl))
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IOException("JWKS retornou status " + response.statusCode());
        }

        JwkSet jwkSet = Jwks.setParser().build().parse(response.body());
        Map<String, Key> fresh = new HashMap<>();
        for (Jwk<?> jwk : jwkSet.getKeys()) {
            String kid = jwk.getId();
            if (StringUtils.hasText(kid)) {
                fresh.put(kid, jwk.toKey());
            }
        }
        if (!fresh.isEmpty()) {
            keysByKid.putAll(fresh);
            log.info("JWKS do Supabase carregado: {} chave(s).", fresh.size());
        }
    }
}
