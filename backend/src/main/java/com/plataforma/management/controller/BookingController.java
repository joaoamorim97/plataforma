package com.plataforma.management.controller;

import com.plataforma.management.dto.BookingRequest;
import com.plataforma.management.dto.MyBookingDto;
import com.plataforma.management.dto.SlotDto;
import com.plataforma.management.service.ManagementService;
import com.plataforma.security.AuthUser;
import com.plataforma.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Agendamento feito pelo próprio cliente a partir da página pública do negócio.
 */
@RestController
@RequestMapping("/api/businesses/{businessId}")
public class BookingController {

    private final ManagementService service;

    public BookingController(ManagementService service) {
        this.service = service;
    }

    /** Horários disponíveis para um dia (público). */
    @GetMapping("/availability")
    public List<SlotDto> availability(@PathVariable Long businessId,
                                      @RequestParam String date,
                                      @RequestParam(required = false) Long providerId) {
        return service.availability(businessId, date, providerId);
    }

    /** Profissionais ativos do negócio (público, para o cliente escolher ao agendar). */
    @GetMapping("/public-providers")
    public List<com.plataforma.management.dto.ProviderDto> publicProviders(@PathVariable Long businessId) {
        return service.listPublicProviders(businessId);
    }

    /** Cliente autenticado marca um horário. */
    @PostMapping("/bookings")
    public ResponseEntity<MyBookingDto> book(@PathVariable Long businessId,
                                             @Valid @RequestBody BookingRequest req) {
        AuthUser user = SecurityUtils.requireUser();
        MyBookingDto dto = service.book(user.userId(), user.email(), businessId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }
}
