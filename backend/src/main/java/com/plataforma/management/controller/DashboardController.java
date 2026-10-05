package com.plataforma.management.controller;

import com.plataforma.management.dto.DashboardStatsDto;
import com.plataforma.management.service.ManagementService;
import com.plataforma.security.SecurityUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/businesses/{businessId}/dashboard")
public class DashboardController {

    private final ManagementService service;

    public DashboardController(ManagementService service) {
        this.service = service;
    }

    @GetMapping("/stats")
    public DashboardStatsDto stats(@PathVariable Long businessId) {
        return service.getStats(SecurityUtils.currentUserId(), businessId);
    }
}
