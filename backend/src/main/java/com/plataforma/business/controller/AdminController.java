package com.plataforma.business.controller;

import com.plataforma.business.dto.AssignOwnerRequest;
import com.plataforma.business.dto.BusinessDetailDto;
import com.plataforma.business.dto.BusinessRequest;
import com.plataforma.business.service.BusinessManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints exclusivos do administrador da plataforma.
 * A verificação de admin é feita no service (requireAdmin via e-mail do JWT).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final BusinessManagementService service;

    public AdminController(BusinessManagementService service) {
        this.service = service;
    }

    /** Lista todos os negócios da plataforma. */
    @GetMapping("/businesses")
    public List<BusinessDetailDto> listAll() {
        return service.adminListAll();
    }

    /** Cria um negócio (pode já atribuir dono via ownerEmail no corpo). */
    @PostMapping("/businesses")
    public ResponseEntity<BusinessDetailDto> create(@Valid @RequestBody BusinessRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.adminCreate(req));
    }

    /** Atribui/transfere o dono de um negócio por e-mail. */
    @PutMapping("/businesses/{id}/owner")
    public BusinessDetailDto assignOwner(@PathVariable Long id, @Valid @RequestBody AssignOwnerRequest req) {
        return service.adminAssignOwner(id, req.ownerEmail());
    }
}
