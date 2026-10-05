package com.plataforma.business.repository;

import com.plataforma.business.entity.BusinessService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusinessServiceRepository extends JpaRepository<BusinessService, Long> {
    List<BusinessService> findByBusinessId(Long businessId);
}
