package com.plataforma.management.repository;

import com.plataforma.management.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByBusinessIdOrderByName(Long businessId);
    long countByBusinessId(Long businessId);
}
