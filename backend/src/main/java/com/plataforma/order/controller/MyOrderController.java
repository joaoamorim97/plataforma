package com.plataforma.order.controller;

import com.plataforma.order.dto.OrderDto;
import com.plataforma.order.service.OrderService;
import com.plataforma.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Pedidos do cliente autenticado (em todos os negócios). */
@RestController
@RequestMapping("/api/me/orders")
public class MyOrderController {

    private final OrderService service;

    public MyOrderController(OrderService service) {
        this.service = service;
    }

    @GetMapping
    public List<OrderDto> myOrders() {
        return service.myOrders(SecurityUtils.currentUserId());
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> cancel(@PathVariable Long orderId) {
        service.cancelMyOrder(SecurityUtils.currentUserId(), orderId);
        return ResponseEntity.noContent().build();
    }
}
