package com.plataforma.management.repository;

import com.plataforma.management.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByBusinessIdAndDateOrderByTime(Long businessId, String date);

    List<Appointment> findByBusinessIdOrderByDateDescTimeDesc(Long businessId);

    List<Appointment> findByBusinessIdAndProviderIdOrderByDateDescTimeDesc(Long businessId, Long providerId);

    long countByBusinessId(Long businessId);

    // Slot collision check: same business, date, time and resource.
    Optional<Appointment> findByBusinessIdAndDateAndTimeAndResourceId(
            Long businessId, String date, String time, Long resourceId);

    // Appointments made by a specific client (self-booking).
    List<Appointment> findByClientUserIdOrderByDateDescTimeDesc(String clientUserId);

    // All non-cancelled appointments of a business on a given date (used for availability).
    List<Appointment> findByBusinessIdAndDateAndStatusNot(Long businessId, String date, String status);

    // Provider collision: same provider already booked at this date+time (non-cancelled).
    Optional<Appointment> findByBusinessIdAndDateAndTimeAndProviderIdAndStatusNot(
            Long businessId, String date, String time, Long providerId, String status);
}
