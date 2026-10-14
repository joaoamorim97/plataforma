package com.plataforma.order.controller;

import com.plataforma.order.dto.OrderDto;
import com.plataforma.order.service.OrderService;
import com.plataforma.security.SecurityUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Pedidos recebidos por um negócio (visíveis para o dono). */
@RestController
@RequestMapping("/api/businesses/{businessId}/orders")
public class OwnerOrderController {

    private final OrderService service;

    public OwnerOrderController(OrderService service) {
        this.service = service;
    }

    @GetMapping
    public List<OrderDto> list(@PathVariable Long businessId) {
        return service.listForOwner(SecurityUtils.currentUserId(), businessId);
    }

    @PutMapping("/{orderId}/status")
    public OrderDto updateStatus(@PathVariable Long businessId,
                                 @PathVariable Long orderId,
                                 @RequestBody Map<String, String> body) {
        return service.updateStatus(SecurityUtils.currentUserId(), businessId, orderId, body.get("status"));
    }
}
