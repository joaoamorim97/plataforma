package com.plataforma.management.service;

import com.plataforma.business.entity.Business;
import com.plataforma.business.entity.BusinessService;
import com.plataforma.business.repository.BusinessRepository;
import com.plataforma.business.repository.BusinessServiceRepository;
import com.plataforma.common.exception.BadRequestException;
import com.plataforma.common.exception.ForbiddenException;
import com.plataforma.common.exception.NotFoundException;
import com.plataforma.management.dto.*;
import com.plataforma.management.entity.Appointment;
import com.plataforma.management.entity.InventoryItem;
import com.plataforma.management.entity.Provider;
import com.plataforma.management.entity.Resource;
import com.plataforma.management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Management layer for a single business (tenant): providers, resources,
 * appointments and inventory. Every write validates that the current user owns
 * the business, reusing the same ownership rule as the rest of the platform.
 */
@Service
public class ManagementService {

    private final BusinessRepository businessRepository;
    private final BusinessServiceRepository serviceRepository;
    private final ProviderRepository providerRepository;
    private final ResourceRepository resourceRepository;
    private final AppointmentRepository appointmentRepository;
    private final InventoryItemRepository inventoryRepository;

    public ManagementService(BusinessRepository businessRepository,
                             BusinessServiceRepository serviceRepository,
                             ProviderRepository providerRepository,
                             ResourceRepository resourceRepository,
                             AppointmentRepository appointmentRepository,
                             InventoryItemRepository inventoryRepository) {
        this.businessRepository = businessRepository;
        this.serviceRepository = serviceRepository;
        this.providerRepository = providerRepository;
        this.resourceRepository = resourceRepository;
        this.appointmentRepository = appointmentRepository;
        this.inventoryRepository = inventoryRepository;
    }

    // =====================================================================
    // Providers
    // =====================================================================

    @Transactional(readOnly = true)
    public List<ProviderDto> listProviders(String userId, Long businessId) {
        requireOwner(businessId, userId);
        return providerRepository.findByBusinessIdOrderByName(businessId).stream().map(this::toProviderDto).toList();
    }

    /** Lista pública dos profissionais ativos (usada no agendamento pelo cliente). */
    @Transactional(readOnly = true)
    public List<ProviderDto> listPublicProviders(Long businessId) {
        Business b = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (!Boolean.TRUE.equals(b.getActive())) {
            throw new NotFoundException("Negócio não encontrado.");
        }
        return providerRepository.findByBusinessIdOrderByName(businessId).stream()
                .filter(p -> Boolean.TRUE.equals(p.getActive()))
                .map(this::toProviderDto).toList();
    }

    @Transactional
    public ProviderDto addProvider(String userId, Long businessId, ProviderRequest req) {
        requireOwner(businessId, userId);
        Provider p = new Provider();
        p.setBusinessId(businessId);
        apply(p, req);
        providerRepository.save(p);
        return toProviderDto(p);
    }

    @Transactional
    public ProviderDto updateProvider(String userId, Long businessId, Long providerId, ProviderRequest req) {
        requireOwner(businessId, userId);
        Provider p = providerRepository.findById(providerId)
                .filter(x -> x.getBusinessId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Profissional não encontrado."));
        apply(p, req);
        providerRepository.save(p);
        return toProviderDto(p);
    }

    @Transactional
    public void deleteProvider(String userId, Long businessId, Long providerId) {
        requireOwner(businessId, userId);
        Provider p = providerRepository.findById(providerId)
                .filter(x -> x.getBusinessId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Profissional não encontrado."));
        providerRepository.delete(p);
    }

    private void apply(Provider p, ProviderRequest req) {
        p.setName(req.name());
        p.setRole(req.role());
        p.setPhone(req.phone());
        p.setAvatarUrl(req.avatarUrl());
        if (req.active() != null) p.setActive(req.active());
    }

    // =====================================================================
    // Resources
    // =====================================================================

    @Transactional(readOnly = true)
    public List<ResourceDto> listResources(String userId, Long businessId) {
        requireOwner(businessId, userId);
        return resourceRepository.findByBusinessIdOrderByName(businessId).stream().map(this::toResourceDto).toList();
    }

    @Transactional
    public ResourceDto addResource(String userId, Long businessId, ResourceRequest req) {
        requireOwner(businessId, userId);
        Resource r = new Resource();
        r.setBusinessId(businessId);
        r.setName(req.name());
        r.setKind(req.kind());
        if (req.active() != null) r.setActive(req.active());
        resourceRepository.save(r);
        return toResourceDto(r);
    }

    @Transactional
    public ResourceDto updateResource(String userId, Long businessId, Long resourceId, ResourceRequest req) {
        requireOwner(businessId, userId);
        Resource r = resourceRepository.findById(resourceId)
                .filter(x -> x.getBusinessId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Recurso não encontrado."));
        r.setName(req.name());
        r.setKind(req.kind());
        if (req.active() != null) r.setActive(req.active());
        resourceRepository.save(r);
        return toResourceDto(r);
    }

    @Transactional
    public void deleteResource(String userId, Long businessId, Long resourceId) {
        requireOwner(businessId, userId);
        Resource r = resourceRepository.findById(resourceId)
                .filter(x -> x.getBusinessId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Recurso não encontrado."));
        resourceRepository.delete(r);
    }

    // =====================================================================
    // Appointments
    // =====================================================================

    @Transactional(readOnly = true)
    public List<AppointmentDto> listAppointments(String userId, Long businessId, String date, Long providerId) {
        requireOwner(businessId, userId);
        List<Appointment> list;
        if (date != null && !date.isBlank()) {
            list = appointmentRepository.findByBusinessIdAndDateOrderByTime(businessId, date);
        } else if (providerId != null) {
            list = appointmentRepository.findByBusinessIdAndProviderIdOrderByDateDescTimeDesc(businessId, providerId);
        } else {
            list = appointmentRepository.findByBusinessIdOrderByDateDescTimeDesc(businessId);
        }
        return enrich(businessId, list);
    }

    @Transactional
    public AppointmentDto createAppointment(String userId, Long businessId, AppointmentRequest req) {
        requireOwner(businessId, userId);
        validateReferences(businessId, req.providerId(), req.resourceId(), req.serviceId());

        // Slot collision: a resource can only hold one appointment per date+time.
        if (req.resourceId() != null) {
            appointmentRepository
                    .findByBusinessIdAndDateAndTimeAndResourceId(businessId, req.date(), req.time(), req.resourceId())
                    .ifPresent(a -> {
                        throw new BadRequestException("Já existe um agendamento neste recurso, data e horário.");
                    });
        }

        Appointment a = new Appointment();
        a.setBusinessId(businessId);
        apply(a, req);
        appointmentRepository.save(a);
        return enrichOne(businessId, a);
    }

    @Transactional
    public AppointmentDto updateAppointment(String userId, Long businessId, Long appointmentId, AppointmentRequest req) {
        requireOwner(businessId, userId);
        Appointment a = appointmentRepository.findById(appointmentId)
                .filter(x -> x.getBusinessId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Agendamento não encontrado."));
        validateReferences(businessId, req.providerId(), req.resourceId(), req.serviceId());
        apply(a, req);
        appointmentRepository.save(a);
        return enrichOne(businessId, a);
    }

    @Transactional
    public void deleteAppointment(String userId, Long businessId, Long appointmentId) {
        requireOwner(businessId, userId);
        Appointment a = appointmentRepository.findById(appointmentId)
                .filter(x -> x.getBusinessId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Agendamento não encontrado."));
        appointmentRepository.delete(a);
    }

    private void apply(Appointment a, AppointmentRequest req) {
        a.setDate(req.date());
        a.setTime(req.time());
        a.setClientName(req.clientName());
        a.setClientPhone(req.clientPhone());
        a.setProviderId(req.providerId());
        a.setResourceId(req.resourceId());
        a.setServiceId(req.serviceId());
        a.setStatus(req.status() != null && !req.status().isBlank() ? req.status() : "BOOKED");
        a.setNotes(req.notes());
    }

    private void validateReferences(Long businessId, Long providerId, Long resourceId, Long serviceId) {
        if (providerId != null) {
            providerRepository.findById(providerId).filter(p -> p.getBusinessId().equals(businessId))
                    .orElseThrow(() -> new BadRequestException("Profissional inválido."));
        }
        if (resourceId != null) {
            resourceRepository.findById(resourceId).filter(r -> r.getBusinessId().equals(businessId))
                    .orElseThrow(() -> new BadRequestException("Recurso inválido."));
        }
        if (serviceId != null) {
            serviceRepository.findById(serviceId).filter(s -> s.getBusiness().getId().equals(businessId))
                    .orElseThrow(() -> new BadRequestException("Serviço inválido."));
        }
    }

    // =====================================================================
    // Inventory
    // =====================================================================

    @Transactional(readOnly = true)
    public List<InventoryItemDto> listInventory(String userId, Long businessId) {
        requireOwner(businessId, userId);
        return inventoryRepository.findByBusinessIdOrderByName(businessId).stream().map(this::toInventoryDto).toList();
    }

    @Transactional
    public InventoryItemDto addInventory(String userId, Long businessId, InventoryItemRequest req) {
        requireOwner(businessId, userId);
        InventoryItem i = new InventoryItem();
        i.setBusinessId(businessId);
        apply(i, req);
        inventoryRepository.save(i);
        return toInventoryDto(i);
    }

    @Transactional
    public InventoryItemDto updateInventory(String userId, Long businessId, Long itemId, InventoryItemRequest req) {
        requireOwner(businessId, userId);
        InventoryItem i = getInventoryItem(businessId, itemId);
        apply(i, req);
        inventoryRepository.save(i);
        return toInventoryDto(i);
    }

    /** Adjusts quantity by a delta (e.g. +1 / -1). Never goes below zero. */
    @Transactional
    public InventoryItemDto adjustInventory(String userId, Long businessId, Long itemId, int delta) {
        requireOwner(businessId, userId);
        InventoryItem i = getInventoryItem(businessId, itemId);
        int q = i.getQuantity() + delta;
        i.setQuantity(Math.max(0, q));
        inventoryRepository.save(i);
        return toInventoryDto(i);
    }

    @Transactional
    public void deleteInventory(String userId, Long businessId, Long itemId) {
        requireOwner(businessId, userId);
        inventoryRepository.delete(getInventoryItem(businessId, itemId));
    }

    private InventoryItem getInventoryItem(Long businessId, Long itemId) {
        return inventoryRepository.findById(itemId)
                .filter(x -> x.getBusinessId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Item de estoque não encontrado."));
    }

    private void apply(InventoryItem i, InventoryItemRequest req) {
        i.setName(req.name());
        i.setKind(req.kind() != null && !req.kind().isBlank() ? req.kind() : "SUPPLY");
        i.setQuantity(req.quantity() != null ? req.quantity() : 0);
        i.setMinQuantity(req.minQuantity() != null ? req.minQuantity() : 3);
        i.setUnitPrice(req.unitPrice());
    }

    // =====================================================================
    // Dashboard stats
    // =====================================================================

    @Transactional(readOnly = true)
    public DashboardStatsDto getStats(String userId, Long businessId) {
        Business b = requireOwner(businessId, userId);

        List<Appointment> appts = appointmentRepository.findByBusinessIdOrderByDateDescTimeDesc(businessId);
        List<BusinessService> services = serviceRepository.findByBusinessId(businessId);
        Map<Long, BigDecimal> priceById = services.stream()
                .filter(s -> s.getPrice() != null)
                .collect(Collectors.toMap(BusinessService::getId, BusinessService::getPrice, (a, c) -> a));

        BigDecimal revenue = appts.stream()
                .filter(a -> !"CANCELLED".equals(a.getStatus()))
                .map(a -> a.getServiceId() == null ? BigDecimal.ZERO : priceById.getOrDefault(a.getServiceId(), BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String today = LocalDate.now().toString();
        long upcoming = appts.stream()
                .filter(a -> !"CANCELLED".equals(a.getStatus()) && a.getDate() != null && a.getDate().compareTo(today) >= 0)
                .count();

        List<InventoryItem> inventory = inventoryRepository.findByBusinessIdOrderByName(businessId);
        long lowStock = inventory.stream().filter(i -> i.getQuantity() <= i.getMinQuantity()).count();

        return new DashboardStatsDto(
                appts.size(),
                upcoming,
                services.size(),
                providerRepository.countByBusinessId(businessId),
                resourceRepository.countByBusinessId(businessId),
                inventory.size(),
                lowStock,
                revenue,
                b.getRating(),
                b.getTotalReviews()
        );
    }

    // =====================================================================
    // Agendamento pelo próprio cliente (self-booking)
    // =====================================================================

    /** Horários oferecidos para agendamento pelo cliente. */
    static final List<String> SLOTS = List.of(
            "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
            "15:00", "16:00", "17:00", "18:00", "19:00", "20:00");

    /** Disponibilidade pública: lista de horários do dia e se estão livres. */
    @Transactional(readOnly = true)
    public List<SlotDto> availability(Long businessId, String date, Long providerId) {
        Business b = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (!Boolean.TRUE.equals(b.getActive())) {
            throw new NotFoundException("Negócio não encontrado.");
        }
        List<Appointment> dayAppts = appointmentRepository
                .findByBusinessIdAndDateAndStatusNot(businessId, date, "CANCELLED");

        return SLOTS.stream().map(slot -> {
            boolean taken;
            if (providerId != null) {
                // horário ocupado se o profissional já tem agendamento nele
                taken = dayAppts.stream().anyMatch(a -> slot.equals(a.getTime())
                        && providerId.equals(a.getProviderId()));
            } else {
                // sem profissional específico: considera ocupado apenas se há agendamento sem profissional nesse horário
                taken = dayAppts.stream().anyMatch(a -> slot.equals(a.getTime()) && a.getProviderId() == null);
            }
            return new SlotDto(slot, !taken);
        }).toList();
    }

    /** Cria um agendamento feito pelo próprio cliente (não exige ownership). */
    @Transactional
    public MyBookingDto book(String clientUserId, String fallbackName, Long businessId, BookingRequest req) {
        Business b = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (!Boolean.TRUE.equals(b.getActive())) {
            throw new NotFoundException("Negócio não encontrado.");
        }
        // valida referências (serviço/profissional devem pertencer ao negócio)
        validateReferences(businessId, req.providerId(), null, req.serviceId());

        // checagem de conflito: profissional não pode ter dois agendamentos no mesmo horário
        if (req.providerId() != null) {
            appointmentRepository
                    .findByBusinessIdAndDateAndTimeAndProviderIdAndStatusNot(
                            businessId, req.date(), req.time(), req.providerId(), "CANCELLED")
                    .ifPresent(a -> {
                        throw new BadRequestException("Este horário já está ocupado para o profissional escolhido.");
                    });
        }

        String name = (req.clientName() != null && !req.clientName().isBlank())
                ? req.clientName().trim()
                : (fallbackName != null && !fallbackName.isBlank() ? fallbackName : "Cliente");

        Appointment a = new Appointment();
        a.setBusinessId(businessId);
        a.setClientUserId(clientUserId);
        a.setDate(req.date());
        a.setTime(req.time());
        a.setClientName(name);
        a.setClientPhone(req.clientPhone());
        a.setProviderId(req.providerId());
        a.setServiceId(req.serviceId());
        a.setStatus("BOOKED");
        a.setNotes(req.notes());
        appointmentRepository.save(a);
        return toMyBookingDto(a, b);
    }

    /** Lista os agendamentos do cliente autenticado. */
    @Transactional(readOnly = true)
    public List<MyBookingDto> myBookings(String clientUserId) {
        List<Appointment> appts = appointmentRepository.findByClientUserIdOrderByDateDescTimeDesc(clientUserId);
        Map<Long, Business> businesses = appts.stream()
                .map(Appointment::getBusinessId)
                .distinct()
                .map(id -> businessRepository.findById(id).orElse(null))
                .filter(x -> x != null)
                .collect(Collectors.toMap(Business::getId, Function.identity()));
        return appts.stream()
                .map(a -> toMyBookingDto(a, businesses.get(a.getBusinessId())))
                .toList();
    }

    /** Cancela um agendamento do próprio cliente. */
    @Transactional
    public void cancelMyBooking(String clientUserId, Long appointmentId) {
        Appointment a = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new NotFoundException("Agendamento não encontrado."));
        if (!clientUserId.equals(a.getClientUserId())) {
            throw new ForbiddenException("Você só pode cancelar os seus próprios agendamentos.");
        }
        a.setStatus("CANCELLED");
        appointmentRepository.save(a);
    }

    private MyBookingDto toMyBookingDto(Appointment a, Business b) {
        BusinessService s = a.getServiceId() == null ? null
                : serviceRepository.findById(a.getServiceId()).orElse(null);
        Provider p = a.getProviderId() == null ? null
                : providerRepository.findById(a.getProviderId()).orElse(null);
        return new MyBookingDto(
                a.getId(),
                a.getBusinessId(),
                b != null ? b.getName() : null,
                b != null && b.getCategory() != null ? b.getCategory().name() : null,
                b != null ? b.getPhone() : null,
                b != null ? b.getWhatsapp() : null,
                a.getDate(),
                a.getTime(),
                a.getServiceId(),
                s != null ? s.getName() : null,
                s != null ? s.getPrice() : null,
                a.getProviderId(),
                p != null ? p.getName() : null,
                a.getStatus()
        );
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private Business requireOwner(Long businessId, String userId) {
        Business b = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (!b.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Você não tem permissão para gerenciar este negócio.");
        }
        return b;
    }

    private List<AppointmentDto> enrich(Long businessId, List<Appointment> appts) {
        Map<Long, Provider> providers = providerRepository.findByBusinessIdOrderByName(businessId).stream()
                .collect(Collectors.toMap(Provider::getId, Function.identity()));
        Map<Long, Resource> resources = resourceRepository.findByBusinessIdOrderByName(businessId).stream()
                .collect(Collectors.toMap(Resource::getId, Function.identity()));
        Map<Long, BusinessService> services = serviceRepository.findByBusinessId(businessId).stream()
                .collect(Collectors.toMap(BusinessService::getId, Function.identity()));
        return appts.stream().map(a -> toAppointmentDto(a, providers, resources, services)).toList();
    }

    private AppointmentDto enrichOne(Long businessId, Appointment a) {
        return enrich(businessId, List.of(a)).get(0);
    }

    private AppointmentDto toAppointmentDto(Appointment a,
                                            Map<Long, Provider> providers,
                                            Map<Long, Resource> resources,
                                            Map<Long, BusinessService> services) {
        Provider p = a.getProviderId() == null ? null : providers.get(a.getProviderId());
        Resource r = a.getResourceId() == null ? null : resources.get(a.getResourceId());
        BusinessService s = a.getServiceId() == null ? null : services.get(a.getServiceId());
        return new AppointmentDto(
                a.getId(), a.getDate(), a.getTime(), a.getClientName(), a.getClientPhone(),
                a.getProviderId(), p != null ? p.getName() : null,
                a.getResourceId(), r != null ? r.getName() : null,
                a.getServiceId(), s != null ? s.getName() : null, s != null ? s.getPrice() : null,
                a.getStatus(), a.getNotes()
        );
    }

    private ProviderDto toProviderDto(Provider p) {
        return new ProviderDto(p.getId(), p.getName(), p.getRole(), p.getPhone(), p.getAvatarUrl(),
                Boolean.TRUE.equals(p.getActive()));
    }

    private ResourceDto toResourceDto(Resource r) {
        return new ResourceDto(r.getId(), r.getName(), r.getKind(), Boolean.TRUE.equals(r.getActive()));
    }

    private InventoryItemDto toInventoryDto(InventoryItem i) {
        return new InventoryItemDto(i.getId(), i.getName(), i.getKind(), i.getQuantity(), i.getMinQuantity(),
                i.getUnitPrice(), i.getQuantity() <= i.getMinQuantity());
    }
}
