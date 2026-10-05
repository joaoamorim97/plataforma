package com.plataforma.business.controller;

import com.plataforma.business.dto.*;
import com.plataforma.business.service.BusinessManagementService;
import com.plataforma.common.BusinessCategory;
import com.plataforma.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/businesses")
public class BusinessController {

    private final BusinessManagementService service;

    public BusinessController(BusinessManagementService service) {
        this.service = service;
    }

    /** Public search/list with optional category, text query and user location (for distance). */
    @GetMapping
    public List<BusinessSummaryDto> list(
            @RequestParam(required = false) BusinessCategory category,
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {
        return service.search(category, query, latitude, longitude);
    }

    /** Public nearby search within a radius (km). */
    @GetMapping("/nearby")
    public List<BusinessSummaryDto> nearby(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "5") double radius,
            @RequestParam(required = false) BusinessCategory category) {
        return service.findNearby(latitude, longitude, radius, category);
    }

    /** Businesses owned by the authenticated user. */
    @GetMapping("/mine")
    public List<BusinessDetailDto> mine() {
        return service.findMine(SecurityUtils.currentUserId());
    }

    @GetMapping("/{id}")
    public BusinessDetailDto get(@PathVariable Long id,
                                 @RequestParam(required = false) Double latitude,
                                 @RequestParam(required = false) Double longitude) {
        return service.getPublicDetail(id, latitude, longitude);
    }

    @PostMapping
    public ResponseEntity<BusinessDetailDto> create(@Valid @RequestBody BusinessRequest req) {
        BusinessDetailDto created = service.create(SecurityUtils.currentUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public BusinessDetailDto update(@PathVariable Long id, @Valid @RequestBody BusinessRequest req) {
        return service.update(SecurityUtils.currentUserId(), id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(SecurityUtils.currentUserId(), id);
        return ResponseEntity.noContent().build();
    }

    // ----- Services -----

    @GetMapping("/{id}/services")
    public List<ServiceDto> listServices(@PathVariable Long id) {
        return service.listServices(id);
    }

    @PostMapping("/{id}/services")
    public ResponseEntity<ServiceDto> addService(@PathVariable Long id, @Valid @RequestBody ServiceRequest req) {
        ServiceDto dto = service.addService(SecurityUtils.currentUserId(), id, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @PutMapping("/{id}/services/{serviceId}")
    public ServiceDto updateService(@PathVariable Long id, @PathVariable Long serviceId,
                                    @Valid @RequestBody ServiceRequest req) {
        return service.updateService(SecurityUtils.currentUserId(), id, serviceId, req);
    }

    @DeleteMapping("/{id}/services/{serviceId}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id, @PathVariable Long serviceId) {
        service.deleteService(SecurityUtils.currentUserId(), id, serviceId);
        return ResponseEntity.noContent().build();
    }

    // ----- Photos -----

    @GetMapping("/{id}/photos")
    public List<ImageDto> listPhotos(@PathVariable Long id) {
        return service.listImages(id);
    }

    @PostMapping("/{id}/photos")
    public ResponseEntity<ImageDto> addPhoto(@PathVariable Long id, @Valid @RequestBody ImageRequest req) {
        ImageDto dto = service.addImage(SecurityUtils.currentUserId(), id, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    public ResponseEntity<Void> deletePhoto(@PathVariable Long id, @PathVariable Long photoId) {
        service.deleteImage(SecurityUtils.currentUserId(), id, photoId);
        return ResponseEntity.noContent().build();
    }

    // ----- Hours -----

    @GetMapping("/{id}/hours")
    public List<HourDto> listHours(@PathVariable Long id) {
        return service.listHours(id);
    }

    @PutMapping("/{id}/hours")
    public List<HourDto> replaceHours(@PathVariable Long id, @RequestBody List<@Valid HourRequest> requests) {
        return service.replaceHours(SecurityUtils.currentUserId(), id, requests);
    }
}
