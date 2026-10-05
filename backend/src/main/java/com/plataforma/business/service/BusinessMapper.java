package com.plataforma.business.service;

import com.plataforma.business.dto.*;
import com.plataforma.business.entity.Business;
import com.plataforma.business.entity.BusinessHour;
import com.plataforma.business.entity.BusinessImage;
import com.plataforma.business.entity.BusinessService;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Component
public class BusinessMapper {

    private final OpenNowCalculator openNowCalculator;

    public BusinessMapper(OpenNowCalculator openNowCalculator) {
        this.openNowCalculator = openNowCalculator;
    }

    public ServiceDto toServiceDto(BusinessService s) {
        return new ServiceDto(s.getId(), s.getName(), s.getDescription(), s.getPrice(), s.getDurationMinutes());
    }

    public ImageDto toImageDto(BusinessImage i) {
        return new ImageDto(i.getId(), i.getImageUrl(), Boolean.TRUE.equals(i.getCover()));
    }

    public HourDto toHourDto(BusinessHour h) {
        return new HourDto(h.getId(), h.getDayOfWeek(), h.getOpeningTime(), h.getClosingTime(),
                Boolean.TRUE.equals(h.getOpen()));
    }

    public BusinessSummaryDto toSummary(Business b, Double distanceKm) {
        return new BusinessSummaryDto(
                b.getId(),
                b.getName(),
                b.getCategory(),
                b.getNeighborhood(),
                b.getCity(),
                b.getLatitude(),
                b.getLongitude(),
                b.getCoverImageUrl(),
                b.getRating(),
                b.getTotalReviews(),
                distanceKm,
                startingPrice(b),
                openNowCalculator.isOpenNow(b.getHours())
        );
    }

    public BusinessDetailDto toDetail(Business b, Double distanceKm) {
        List<ServiceDto> services = b.getServices().stream().map(this::toServiceDto).toList();
        List<ImageDto> images = b.getImages().stream()
                .sorted(Comparator.comparing((BusinessImage i) -> Boolean.TRUE.equals(i.getCover())).reversed())
                .map(this::toImageDto).toList();
        List<HourDto> hours = b.getHours().stream()
                .sorted(Comparator.comparing(BusinessHour::getDayOfWeek))
                .map(this::toHourDto).toList();

        return new BusinessDetailDto(
                b.getId(),
                b.getOwnerId(),
                b.getName(),
                b.getCategory(),
                b.getDescription(),
                b.getPhone(),
                b.getWhatsapp(),
                b.getAddress(),
                b.getAddressNumber(),
                b.getNeighborhood(),
                b.getCity(),
                b.getState(),
                b.getPostalCode(),
                b.getLatitude(),
                b.getLongitude(),
                b.getCoverImageUrl(),
                b.getRating(),
                b.getTotalReviews(),
                Boolean.TRUE.equals(b.getActive()),
                distanceKm,
                openNowCalculator.isOpenNow(b.getHours()),
                services,
                images,
                hours
        );
    }

    private BigDecimal startingPrice(Business b) {
        return b.getServices().stream()
                .map(BusinessService::getPrice)
                .filter(p -> p != null)
                .min(Comparator.naturalOrder())
                .orElse(null);
    }
}
