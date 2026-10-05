package com.plataforma.management.controller;

import com.plataforma.management.dto.MyBookingDto;
import com.plataforma.management.service.ManagementService;
import com.plataforma.security.SecurityUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Agendamentos do cliente autenticado (em todos os negócios). */
@RestController
@RequestMapping("/api/me/bookings")
public class MyBookingController {

    private final ManagementService service;

    public MyBookingController(ManagementService service) {
        this.service = service;
    }

    @GetMapping
    public List<MyBookingDto> list() {
        return service.myBookings(SecurityUtils.currentUserId());
    }

    @DeleteMapping("/{appointmentId}")
    public ResponseEntity<Void> cancel(@PathVariable Long appointmentId) {
        service.cancelMyBooking(SecurityUtils.currentUserId(), appointmentId);
        return ResponseEntity.noContent().build();
    }
}
