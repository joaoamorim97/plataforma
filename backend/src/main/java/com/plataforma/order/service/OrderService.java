package com.plataforma.order.service;

import com.plataforma.business.entity.Business;
import com.plataforma.business.repository.BusinessRepository;
import com.plataforma.common.exception.BadRequestException;
import com.plataforma.common.exception.ForbiddenException;
import com.plataforma.common.exception.NotFoundException;
import com.plataforma.management.entity.InventoryItem;
import com.plataforma.management.repository.InventoryItemRepository;
import com.plataforma.order.dto.*;
import com.plataforma.order.entity.Order;
import com.plataforma.order.entity.OrderItem;
import com.plataforma.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Pedidos de produtos de revenda (RESALE). O checkout baixa o estoque de forma
 * transacional; cancelar um pedido repõe o estoque. Pedidos pertencem a um
 * negócio (visíveis para o dono) e a um cliente (visíveis em "Meus pedidos").
 */
@Service
public class OrderService {

    private static final String RESALE = "RESALE";
    private static final Set<String> VALID_STATUS = Set.of("PENDING", "CONFIRMED", "DELIVERED", "CANCELLED");

    private final BusinessRepository businessRepository;
    private final InventoryItemRepository inventoryRepository;
    private final OrderRepository orderRepository;

    public OrderService(BusinessRepository businessRepository,
                        InventoryItemRepository inventoryRepository,
                        OrderRepository orderRepository) {
        this.businessRepository = businessRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderRepository = orderRepository;
    }

    // =====================================================================
    // Catálogo público de produtos (revenda com estoque > 0)
    // =====================================================================

    @Transactional(readOnly = true)
    public List<ProductDto> listProducts(Long businessId) {
        Business b = activeBusiness(businessId);
        return inventoryRepository.findByBusinessIdOrderByName(b.getId()).stream()
                .filter(i -> RESALE.equalsIgnoreCase(i.getKind()))
                .filter(i -> i.getQuantity() != null && i.getQuantity() > 0)
                .map(i -> new ProductDto(i.getId(), i.getName(), i.getUnitPrice(), i.getQuantity()))
                .toList();
    }

    // =====================================================================
    // Checkout pelo cliente
    // =====================================================================

    @Transactional
    public OrderDto checkout(String clientUserId, String fallbackName, Long businessId, OrderRequest req) {
        Business b = activeBusiness(businessId);

        // Consolida quantidades por produto (caso o mesmo id venha repetido).
        Map<Long, Integer> wanted = new LinkedHashMap<>();
        for (OrderRequest.Line line : req.items()) {
            wanted.merge(line.productId(), line.quantity(), Integer::sum);
        }

        String name = (req.clientName() != null && !req.clientName().isBlank())
                ? req.clientName().trim()
                : (fallbackName != null && !fallbackName.isBlank() ? fallbackName : "Cliente");

        Order order = new Order();
        order.setBusinessId(businessId);
        order.setClientUserId(clientUserId);
        order.setClientName(name);
        order.setClientPhone(req.clientPhone());
        order.setNotes(req.notes());
        order.setStatus("PENDING");

        BigDecimal total = BigDecimal.ZERO;

        for (Map.Entry<Long, Integer> e : wanted.entrySet()) {
            Long productId = e.getKey();
            int qty = e.getValue();

            InventoryItem item = inventoryRepository.findById(productId)
                    .filter(i -> i.getBusinessId().equals(businessId))
                    .orElseThrow(() -> new BadRequestException("Produto indisponível."));

            if (!RESALE.equalsIgnoreCase(item.getKind())) {
                throw new BadRequestException("Este item não está à venda.");
            }
            int available = item.getQuantity() == null ? 0 : item.getQuantity();
            if (qty > available) {
                throw new BadRequestException("Estoque insuficiente para \"" + item.getName()
                        + "\" (disponível: " + available + ").");
            }

            // Baixa de estoque
            item.setQuantity(available - qty);
            inventoryRepository.save(item);

            BigDecimal unit = item.getUnitPrice() == null ? BigDecimal.ZERO : item.getUnitPrice();
            OrderItem oi = new OrderItem();
            oi.setInventoryId(item.getId());
            oi.setProductName(item.getName());
            oi.setUnitPrice(unit);
            oi.setQuantity(qty);
            order.addItem(oi);

            total = total.add(unit.multiply(BigDecimal.valueOf(qty)));
        }

        order.setTotal(total);
        orderRepository.save(order);
        return toDto(order, b.getName());
    }

    // =====================================================================
    // Cliente: listar e cancelar
    // =====================================================================

    @Transactional(readOnly = true)
    public List<OrderDto> myOrders(String clientUserId) {
        List<Order> orders = orderRepository.findByClientUserIdOrderByCreatedAtDesc(clientUserId);
        Map<Long, String> names = new LinkedHashMap<>();
        return orders.stream()
                .map(o -> toDto(o, names.computeIfAbsent(o.getBusinessId(), id ->
                        businessRepository.findById(id).map(Business::getName).orElse(null))))
                .toList();
    }

    @Transactional
    public void cancelMyOrder(String clientUserId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Pedido não encontrado."));
        if (!clientUserId.equals(order.getClientUserId())) {
            throw new ForbiddenException("Você só pode cancelar os seus próprios pedidos.");
        }
        if ("DELIVERED".equals(order.getStatus()) || "CANCELLED".equals(order.getStatus())) {
            throw new BadRequestException("Este pedido não pode mais ser cancelado.");
        }
        restock(order);
        order.setStatus("CANCELLED");
        orderRepository.save(order);
    }

    // =====================================================================
    // Dono: listar e mudar status
    // =====================================================================

    @Transactional(readOnly = true)
    public List<OrderDto> listForOwner(String userId, Long businessId) {
        Business b = requireOwner(businessId, userId);
        return orderRepository.findByBusinessIdOrderByCreatedAtDesc(businessId).stream()
                .map(o -> toDto(o, b.getName()))
                .toList();
    }

    @Transactional
    public OrderDto updateStatus(String userId, Long businessId, Long orderId, String status) {
        Business b = requireOwner(businessId, userId);
        if (status == null || !VALID_STATUS.contains(status.toUpperCase())) {
            throw new BadRequestException("Status inválido.");
        }
        String target = status.toUpperCase();
        Order order = orderRepository.findById(orderId)
                .filter(o -> o.getBusinessId().equals(businessId))
                .orElseThrow(() -> new NotFoundException("Pedido não encontrado."));

        boolean wasActive = !"CANCELLED".equals(order.getStatus());
        // Cancelar pelo dono repõe o estoque (só se ainda não estava cancelado).
        if ("CANCELLED".equals(target) && wasActive) {
            restock(order);
        }
        order.setStatus(target);
        orderRepository.save(order);
        return toDto(order, b.getName());
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private void restock(Order order) {
        for (OrderItem it : order.getItems()) {
            if (it.getInventoryId() == null) continue;
            inventoryRepository.findById(it.getInventoryId()).ifPresent(inv -> {
                int q = inv.getQuantity() == null ? 0 : inv.getQuantity();
                inv.setQuantity(q + it.getQuantity());
                inventoryRepository.save(inv);
            });
        }
    }

    private Business activeBusiness(Long businessId) {
        Business b = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (!Boolean.TRUE.equals(b.getActive())) {
            throw new NotFoundException("Negócio não encontrado.");
        }
        return b;
    }

    private Business requireOwner(Long businessId, String userId) {
        Business b = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (!b.getOwnerId().equals(userId)) {
            throw new ForbiddenException("Você não tem permissão para gerenciar este negócio.");
        }
        return b;
    }

    private OrderDto toDto(Order o, String businessName) {
        List<OrderItemDto> items = o.getItems().stream()
                .map(it -> new OrderItemDto(
                        it.getId(),
                        it.getInventoryId(),
                        it.getProductName(),
                        it.getUnitPrice(),
                        it.getQuantity(),
                        it.getUnitPrice().multiply(BigDecimal.valueOf(it.getQuantity()))))
                .toList();
        return new OrderDto(
                o.getId(),
                o.getBusinessId(),
                businessName,
                o.getClientName(),
                o.getClientPhone(),
                o.getTotal(),
                o.getStatus(),
                o.getNotes(),
                o.getCreatedAt() != null ? o.getCreatedAt().toString() : null,
                items
        );
    }
}
