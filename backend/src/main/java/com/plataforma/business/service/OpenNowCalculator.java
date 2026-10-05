package com.plataforma.business.service;

import com.plataforma.business.entity.BusinessHour;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

/** Computes whether a business is currently open based on its weekly hours. */
@Component
public class OpenNowCalculator {

    // São Paulo timezone for the MVP (all demo data is in SP).
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    public boolean isOpenNow(List<BusinessHour> hours) {
        if (hours == null || hours.isEmpty()) {
            return false;
        }
        ZonedDateTime now = ZonedDateTime.now(ZONE);
        // java.time: MONDAY=1..SUNDAY=7 -> convert to our 0=Sunday..6=Saturday
        int javaDow = now.getDayOfWeek().getValue(); // 1..7
        int ourDow = javaDow % 7; // Sunday(7)->0, Monday(1)->1, ... Saturday(6)->6
        LocalTime nowTime = now.toLocalTime();

        return hours.stream()
                .filter(h -> h.getDayOfWeek() != null && h.getDayOfWeek() == ourDow)
                .filter(h -> Boolean.TRUE.equals(h.getOpen()))
                .anyMatch(h -> withinRange(nowTime, h.getOpeningTime(), h.getClosingTime()));
    }

    private boolean withinRange(LocalTime now, String opening, String closing) {
        LocalTime open = parse(opening);
        LocalTime close = parse(closing);
        if (open == null || close == null) {
            return false;
        }
        if (close.isAfter(open)) {
            return !now.isBefore(open) && now.isBefore(close);
        }
        // Overnight range (e.g. 18:00 - 02:00)
        return !now.isBefore(open) || now.isBefore(close);
    }

    private LocalTime parse(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(value.trim());
        } catch (Exception e) {
            return null;
        }
    }
}
