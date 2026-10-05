package com.plataforma.management.controller;

import com.plataforma.management.dto.ProviderDto;
import com.plataforma.management.dto.ProviderRequest;
import com.plataforma.management.service.ManagementService;
import com.plataforma.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/businesses/{businessId}/providers")
public class ProviderController {

    private final ManagementService service;

    public ProviderController(ManagementService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProviderDto> list(@PathVariable Long businessId) {
        return service.listProviders(SecurityUtils.currentUserId(), businessId);
    }

    @PostMapping
    public ResponseEntity<ProviderDto> add(@PathVariable Long businessId, @Valid @RequestBody ProviderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addProvider(SecurityUtils.currentUserId(), businessId, req));
    }

    @PutMapping("/{providerId}")
    public ProviderDto update(@PathVariable Long businessId, @PathVariable Long providerId,
                              @Valid @RequestBody ProviderRequest req) {
        return service.updateProvider(SecurityUtils.currentUserId(), businessId, providerId, req);
    }

    @DeleteMapping("/{providerId}")
    public ResponseEntity<Void> delete(@PathVariable Long businessId, @PathVariable Long providerId) {
        service.deleteProvider(SecurityUtils.currentUserId(), businessId, providerId);
        return ResponseEntity.noContent().build();
    }
}
