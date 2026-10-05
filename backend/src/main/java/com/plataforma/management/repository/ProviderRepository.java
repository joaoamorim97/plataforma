package com.plataforma.management.repository;

import com.plataforma.management.entity.Provider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProviderRepository extends JpaRepository<Provider, Long> {
    List<Provider> findByBusinessIdOrderByName(Long businessId);
    long countByBusinessId(Long businessId);
}
