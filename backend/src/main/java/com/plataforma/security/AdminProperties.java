package com.plataforma.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Define quais e-mails são administradores da plataforma.
 * Configurável via APP_ADMIN_EMAILS (lista separada por vírgula).
 * O e-mail de demonstração admin@perto.app é sempre admin para facilitar testes.
 */
@Component
public class AdminProperties {

    private final Set<String> adminEmails = new HashSet<>();

    public AdminProperties(@Value("${app.admin.emails:}") String emails) {
        adminEmails.add("admin@perto.app");
        if (emails != null && !emails.isBlank()) {
            Arrays.stream(emails.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .map(String::toLowerCase)
                    .forEach(adminEmails::add);
        }
    }

    public boolean isAdmin(String email) {
        return email != null && adminEmails.contains(email.toLowerCase());
    }
}
