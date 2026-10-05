package com.plataforma.management.dto;

import java.math.BigDecimal;

/** Aggregated KPIs for the owner dashboard of a single business (tenant). */
public record DashboardStatsDto(
        long totalAppointments,
        long upcomingAppointments,
        long catalogServices,
        long providers,
        long resources,
        long inventoryItems,
        long lowStockItems,
        BigDecimal estimatedRevenue,
        double rating,
        int totalReviews
) {}
