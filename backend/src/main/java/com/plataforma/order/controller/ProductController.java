package com.plataforma.order.controller;

import com.plataforma.order.dto.OrderDto;
import com.plataforma.order.dto.OrderRequest;
import com.plataforma.order.dto.ProductDto;
import com.plataforma.order.service.OrderService;
import com.plataforma.security.AuthUser;
import com.plataforma.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Catálogo público de produtos de revenda + checkout pelo cliente.
 */
@RestController
@RequestMapping("/api/businesses/{businessId}")
public class ProductController {

    private final OrderService service;

    public ProductController(OrderService service) {
        this.service = service;
    }

    /** Produtos de revenda com estoque disponível (público). */
    @GetMapping("/products")
    public List<ProductDto> products(@PathVariable Long businessId) {
        return service.listProducts(businessId);
    }

    /** Cliente autenticado finaliza a compra (checkout). */
    @PostMapping("/orders")
    public ResponseEntity<OrderDto> checkout(@PathVariable Long businessId,
                                             @Valid @RequestBody OrderRequest req) {
        AuthUser user = SecurityUtils.requireUser();
        OrderDto dto = service.checkout(user.userId(), user.email(), businessId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
