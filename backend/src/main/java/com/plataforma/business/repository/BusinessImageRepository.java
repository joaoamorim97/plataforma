package com.plataforma.business.repository;

import com.plataforma.business.entity.BusinessImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusinessImageRepository extends JpaRepository<BusinessImage, Long> {
    List<BusinessImage> findByBusinessId(Long businessId);
}
