package com.plataforma.management.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_id", nullable = false)
    private Long businessId;

    @Column(name = "appt_date", nullable = false)
    private String date; // YYYY-MM-DD

    @Column(name = "appt_time", nullable = false)
    private String time; // HH:mm

    @Column(name = "client_name", nullable = false)
    private String clientName;

    @Column(name = "client_phone")
    private String clientPhone;

    /** Supabase user id do cliente que marcou o horário (null se criado pelo dono). */
    @Column(name = "client_user_id")
    private String clientUserId;

    @Column(name = "provider_id")
    private Long providerId;

    @Column(name = "resource_id")
    private Long resourceId;

    @Column(name = "service_id")
    private Long serviceId;

    @Column(nullable = false)
    private String status = "BOOKED";

    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
