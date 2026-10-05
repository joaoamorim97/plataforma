package com.plataforma.management.controller;

import com.plataforma.management.dto.ResourceDto;
import com.plataforma.management.dto.ResourceRequest;
import com.plataforma.management.service.ManagementService;
import com.plataforma.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/businesses/{businessId}/resources")
public class ResourceController {

    private final ManagementService service;

    public ResourceController(ManagementService service) {
        this.service = service;
    }

    @GetMapping
    public List<ResourceDto> list(@PathVariable Long businessId) {
        return service.listResources(SecurityUtils.currentUserId(), businessId);
    }

    @PostMapping
    public ResponseEntity<ResourceDto> add(@PathVariable Long businessId, @Valid @RequestBody ResourceRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addResource(SecurityUtils.currentUserId(), businessId, req));
    }

    @PutMapping("/{resourceId}")
    public ResourceDto update(@PathVariable Long businessId, @PathVariable Long resourceId,
                              @Valid @RequestBody ResourceRequest req) {
        return service.updateResource(SecurityUtils.currentUserId(), businessId, resourceId, req);
    }

    @DeleteMapping("/{resourceId}")
    public ResponseEntity<Void> delete(@PathVariable Long businessId, @PathVariable Long resourceId) {
        service.deleteResource(SecurityUtils.currentUserId(), businessId, resourceId);
        return ResponseEntity.noContent().build();
    }
}
