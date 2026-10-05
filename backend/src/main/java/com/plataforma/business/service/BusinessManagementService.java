package com.plataforma.business.service;

import com.plataforma.business.dto.*;
import com.plataforma.business.entity.Business;
import com.plataforma.business.entity.BusinessHour;
import com.plataforma.business.entity.BusinessImage;
import com.plataforma.business.repository.*;
import com.plataforma.common.BusinessCategory;
import com.plataforma.common.GeoUtils;
import com.plataforma.common.exception.BadRequestException;
import com.plataforma.common.exception.ForbiddenException;
import com.plataforma.common.exception.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class BusinessManagementService {

    private static final int MAX_IMAGES = 15;

    private final BusinessRepository businessRepository;
    private final BusinessServiceRepository serviceRepository;
    private final BusinessImageRepository imageRepository;
    private final BusinessHourRepository hourRepository;
    private final BusinessMapper mapper;

    public BusinessManagementService(BusinessRepository businessRepository,
                                     BusinessServiceRepository serviceRepository,
                                     BusinessImageRepository imageRepository,
                                     BusinessHourRepository hourRepository,
                                     BusinessMapper mapper) {
        this.businessRepository = businessRepository;
        this.serviceRepository = serviceRepository;
        this.imageRepository = imageRepository;
        this.hourRepository = hourRepository;
        this.mapper = mapper;
    }

    // ---------------------------------------------------------------------
    // Queries
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<BusinessSummaryDto> search(BusinessCategory category, String query,
                                           Double latitude, Double longitude) {
        return businessRepository.search(category, blankToNull(query)).stream()
                .map(b -> mapper.toSummary(b, GeoUtils.distanceKm(latitude, longitude, b.getLatitude(), b.getLongitude())))
                .sorted(distanceComparator())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BusinessSummaryDto> findNearby(double latitude, double longitude, double radiusKm,
                                               BusinessCategory category) {
        return businessRepository.search(category, null).stream()
                .map(b -> {
                    Double dist = GeoUtils.distanceKm(latitude, longitude, b.getLatitude(), b.getLongitude());
                    return mapper.toSummary(b, dist);
                })
                .filter(s -> s.distanceKm() != null && s.distanceKm() <= radiusKm)
                .sorted(Comparator.comparing(BusinessSummaryDto::distanceKm))
                .toList();
    }

    @Transactional(readOnly = true)
    public BusinessDetailDto getPublicDetail(Long id, Double latitude, Double longitude) {
        Business b = getActiveOrOwned(id);
        return mapper.toDetail(b, GeoUtils.distanceKm(latitude, longitude, b.getLatitude(), b.getLongitude()));
    }

    @Transactional(readOnly = true)
    public List<BusinessDetailDto> findMine(String ownerId) {
        return businessRepository.findByOwnerId(ownerId).stream()
                .map(b -> mapper.toDetail(b, null))
                .toList();
    }

    // ---------------------------------------------------------------------
    // Business CRUD
    // ---------------------------------------------------------------------

    @Transactional
    public BusinessDetailDto create(String ownerId, BusinessRequest req) {
        Business b = new Business();
        b.setOwnerId(ownerId);
        apply(b, req);
        if (req.active() == null) {
            b.setActive(true);
        }
        businessRepository.save(b);
        return mapper.toDetail(b, null);
    }

    @Transactional
    public BusinessDetailDto update(String ownerId, Long id, BusinessRequest req) {
        Business b = getOwned(id, ownerId);
        apply(b, req);
        businessRepository.save(b);
        return mapper.toDetail(b, null);
    }

    @Transactional
    public void delete(String ownerId, Long id) {
        Business b = getOwned(id, ownerId);
        businessRepository.delete(b);
    }

    private void apply(Business b, BusinessRequest req) {
        b.setName(req.name());
        b.setCategory(req.category());
        b.setDescription(req.description());
        b.setPhone(req.phone());
        b.setWhatsapp(req.whatsapp());
        b.setAddress(req.address());
        b.setAddressNumber(req.addressNumber());
        b.setNeighborhood(req.neighborhood());
        b.setCity(req.city());
        b.setState(req.state());
        b.setPostalCode(req.postalCode());
        b.setLatitude(req.latitude());
        b.setLongitude(req.longitude());
        b.setCoverImageUrl(req.coverImageUrl());
        if (req.active() != null) {
            b.setActive(req.active());
        }
    }

    // ---------------------------------------------------------------------
    // Services
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ServiceDto> listServices(Long businessId) {
        getActiveOrOwned(businessId);
        return serviceRepository.findByBusinessId(businessId).stream().map(mapper::toServiceDto).toList();
    }

    @Transactional
    public ServiceDto addService(String ownerId, Long businessId, ServiceRequest req) {
        Business b = getOwned(businessId, ownerId);
        com.plataforma.business.entity.BusinessService s = new com.plataforma.business.entity.BusinessService();
        s.setBusiness(b);
        s.setName(req.name());
        s.setDescription(req.description());
        s.setPrice(req.price());
        s.setDurationMinutes(req.durationMinutes());
        serviceRepository.save(s);
        return mapper.toServiceDto(s);
    }

    @Transactional
    public ServiceDto updateService(String ownerId, Long businessId, Long serviceId, ServiceRequest req) {
        getOwned(businessId, ownerId);
        var s = serviceRepository.findById(serviceId)
                .filter(x -> x.getBusiness().getId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Serviço não encontrado."));
        s.setName(req.name());
        s.setDescription(req.description());
        s.setPrice(req.price());
        s.setDurationMinutes(req.durationMinutes());
        serviceRepository.save(s);
        return mapper.toServiceDto(s);
    }

    @Transactional
    public void deleteService(String ownerId, Long businessId, Long serviceId) {
        getOwned(businessId, ownerId);
        var s = serviceRepository.findById(serviceId)
                .filter(x -> x.getBusiness().getId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Serviço não encontrado."));
        serviceRepository.delete(s);
    }

    // ---------------------------------------------------------------------
    // Images
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ImageDto> listImages(Long businessId) {
        getActiveOrOwned(businessId);
        return imageRepository.findByBusinessId(businessId).stream()
                .sorted(Comparator.comparing((BusinessImage i) -> Boolean.TRUE.equals(i.getCover())).reversed())
                .map(mapper::toImageDto).toList();
    }

    @Transactional
    public ImageDto addImage(String ownerId, Long businessId, ImageRequest req) {
        Business b = getOwned(businessId, ownerId);
        List<BusinessImage> existing = imageRepository.findByBusinessId(businessId);
        if (existing.size() >= MAX_IMAGES) {
            throw new BadRequestException("Limite de " + MAX_IMAGES + " imagens atingido.");
        }
        BusinessImage img = new BusinessImage();
        img.setBusiness(b);
        img.setImageUrl(req.imageUrl());
        img.setCover(req.cover());
        if (req.cover()) {
            existing.forEach(i -> i.setCover(false));
            imageRepository.saveAll(existing);
            b.setCoverImageUrl(req.imageUrl());
            businessRepository.save(b);
        }
        imageRepository.save(img);
        return mapper.toImageDto(img);
    }

    @Transactional
    public void deleteImage(String ownerId, Long businessId, Long imageId) {
        getOwned(businessId, ownerId);
        var img = imageRepository.findById(imageId)
                .filter(x -> x.getBusiness().getId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Imagem não encontrada."));
        imageRepository.delete(img);
    }

    // ---------------------------------------------------------------------
    // Hours
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<HourDto> listHours(Long businessId) {
        getActiveOrOwned(businessId);
        return hourRepository.findByBusinessIdOrderByDayOfWeek(businessId).stream()
                .map(mapper::toHourDto).toList();
    }

    @Transactional
    public List<HourDto> replaceHours(String ownerId, Long businessId, List<HourRequest> requests) {
        Business b = getOwned(businessId, ownerId);
        if (requests == null) {
            throw new BadRequestException("Horários inválidos.");
        }
        // Replace the full weekly schedule
        List<BusinessHour> current = hourRepository.findByBusinessIdOrderByDayOfWeek(businessId);
        hourRepository.deleteAll(current);
        hourRepository.flush();
        List<BusinessHour> saved = requests.stream().map(r -> {
            BusinessHour h = new BusinessHour();
            h.setBusiness(b);
            h.setDayOfWeek(r.dayOfWeek());
            h.setOpen(r.open());
            h.setOpeningTime(r.open() ? r.openingTime() : null);
            h.setClosingTime(r.open() ? r.closingTime() : null);
            return h;
        }).toList();
        hourRepository.saveAll(saved);
        return saved.stream()
                .sorted(Comparator.comparing(BusinessHour::getDayOfWeek))
                .map(mapper::toHourDto).toList();
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private Business getActiveOrOwned(Long id) {
        Business b = businessRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (Boolean.TRUE.equals(b.getActive())) {
            return b;
        }
        // Inactive businesses are only visible to their owner
        var user = com.plataforma.security.SecurityUtils.currentUserOrNull();
        if (user != null && user.userId().equals(b.getOwnerId())) {
            return b;
        }
        throw new NotFoundException("Negócio não encontrado.");
    }

    private Business getOwned(Long id, String ownerId) {
        Business b = businessRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (!b.getOwnerId().equals(ownerId)) {
            throw new ForbiddenException("Você não tem permissão para alterar este negócio.");
        }
        return b;
    }

    private Comparator<BusinessSummaryDto> distanceComparator() {
        return Comparator.comparing(BusinessSummaryDto::distanceKm,
                Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
