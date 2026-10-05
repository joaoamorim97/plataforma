package com.plataforma.management.repository;

import com.plataforma.management.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByBusinessIdOrderByName(Long businessId);
    long countByBusinessId(Long businessId);
}
