package com.plataforma.order.repository;

import com.plataforma.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBusinessIdOrderByCreatedAtDesc(Long businessId);

    List<Order> findByClientUserIdOrderByCreatedAtDesc(String clientUserId);
}
