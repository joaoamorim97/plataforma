package com.plataforma.common;

/**
 * Business categories. The platform is designed to be generic; new categories
 * (PUB, RESTAURANT, GYM, CLINIC, ...) can be added without schema changes.
 * The MVP only exposes beauty-related categories.
 */
public enum BusinessCategory {
    HAIRDRESSER,
    BARBER
}
