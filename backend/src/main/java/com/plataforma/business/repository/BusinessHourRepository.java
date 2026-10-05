package com.plataforma.business.repository;

import com.plataforma.business.entity.BusinessHour;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BusinessHourRepository extends JpaRepository<BusinessHour, Long> {
    List<BusinessHour> findByBusinessIdOrderByDayOfWeek(Long businessId);
}
