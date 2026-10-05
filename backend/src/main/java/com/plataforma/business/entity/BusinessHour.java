package com.plataforma.business.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "business_hours")
public class BusinessHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private Business business;

    /** 0 = Sunday ... 6 = Saturday */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    /** 'HH:mm' format, nullable when closed. */
    @Column(name = "opening_time")
    private String openingTime;

    @Column(name = "closing_time")
    private String closingTime;

    @Column(name = "is_open", nullable = false)
    private Boolean open = true;
}
