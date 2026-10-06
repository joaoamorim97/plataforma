package com.plataforma.business.repository;

import com.plataforma.business.entity.Business;
import com.plataforma.common.BusinessCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BusinessRepository extends JpaRepository<Business, Long> {

    List<Business> findByOwnerId(String ownerId);

    List<Business> findByActiveTrue();

    /**
     * Busca negócios ativos por categoria e/ou termo de texto.
     * O termo é passado já normalizado (minúsculo, com %...% ou null) para evitar
     * problemas de inferência de tipo do parâmetro no PostgreSQL (ex.: lower(bytea)).
     */
    @Query("""
            SELECT b FROM Business b
            WHERE b.active = true
              AND (:category IS NULL OR b.category = :category)
              AND (:searchLike IS NULL
                   OR LOWER(b.name) LIKE :searchLike
                   OR LOWER(COALESCE(b.description, '')) LIKE :searchLike)
            """)
    List<Business> search(@Param("category") BusinessCategory category,
                          @Param("searchLike") String searchLike);
}
