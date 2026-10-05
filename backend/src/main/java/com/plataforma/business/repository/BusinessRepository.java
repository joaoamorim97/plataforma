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

    @Query("""
            SELECT b FROM Business b
            WHERE b.active = true
              AND (:category IS NULL OR b.category = :category)
              AND (:search IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(b.description) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    List<Business> search(@Param("category") BusinessCategory category,
                          @Param("search") String search);
}
