package com.plataforma.management.controller;

import com.plataforma.management.dto.InventoryItemDto;
import com.plataforma.management.dto.InventoryItemRequest;
import com.plataforma.management.service.ManagementService;
import com.plataforma.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/businesses/{businessId}/inventory")
public class InventoryController {

    private final ManagementService service;

    public InventoryController(ManagementService service) {
        this.service = service;
    }

    @GetMapping
    public List<InventoryItemDto> list(@PathVariable Long businessId) {
        return service.listInventory(SecurityUtils.currentUserId(), businessId);
    }

    @PostMapping
    public ResponseEntity<InventoryItemDto> add(@PathVariable Long businessId, @Valid @RequestBody InventoryItemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addInventory(SecurityUtils.currentUserId(), businessId, req));
    }

    @PutMapping("/{itemId}")
    public InventoryItemDto update(@PathVariable Long businessId, @PathVariable Long itemId,
                                   @Valid @RequestBody InventoryItemRequest req) {
        return service.updateInventory(SecurityUtils.currentUserId(), businessId, itemId, req);
    }

    /** Adjusts quantity by a delta, e.g. { "delta": -1 }. */
    @PatchMapping("/{itemId}/quantity")
    public InventoryItemDto adjust(@PathVariable Long businessId, @PathVariable Long itemId,
                                   @RequestBody Map<String, Integer> body) {
        int delta = body.getOrDefault("delta", 0);
        return service.adjustInventory(SecurityUtils.currentUserId(), businessId, itemId, delta);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> delete(@PathVariable Long businessId, @PathVariable Long itemId) {
        service.deleteInventory(SecurityUtils.currentUserId(), businessId, itemId);
        return ResponseEntity.noContent().build();
    }
}
