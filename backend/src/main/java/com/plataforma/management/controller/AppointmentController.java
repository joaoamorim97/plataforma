package com.plataforma.management.controller;

import com.plataforma.management.dto.AppointmentDto;
import com.plataforma.management.dto.AppointmentRequest;
import com.plataforma.management.service.ManagementService;
import com.plataforma.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/businesses/{businessId}/appointments")
public class AppointmentController {

    private final ManagementService service;

    public AppointmentController(ManagementService service) {
        this.service = service;
    }

    /** List appointments, optionally filtered by date (YYYY-MM-DD) or providerId. */
    @GetMapping
    public List<AppointmentDto> list(@PathVariable Long businessId,
                                     @RequestParam(required = false) String date,
                                     @RequestParam(required = false) Long providerId) {
        return service.listAppointments(SecurityUtils.currentUserId(), businessId, date, providerId);
    }

    @PostMapping
    public ResponseEntity<AppointmentDto> create(@PathVariable Long businessId,
                                                 @Valid @RequestBody AppointmentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createAppointment(SecurityUtils.currentUserId(), businessId, req));
    }

    @PutMapping("/{appointmentId}")
    public AppointmentDto update(@PathVariable Long businessId, @PathVariable Long appointmentId,
                                 @Valid @RequestBody AppointmentRequest req) {
        return service.updateAppointment(SecurityUtils.currentUserId(), businessId, appointmentId, req);
    }

    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<Void> delete(@PathVariable Long businessId, @PathVariable Long appointmentId) {
        service.deleteAppointment(SecurityUtils.currentUserId(), businessId, appointmentId);
        return ResponseEntity.noContent().build();
    }
}
