package com.plataforma.favorite.controller;

import com.plataforma.business.dto.BusinessSummaryDto;
import com.plataforma.favorite.service.FavoriteService;
import com.plataforma.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<BusinessSummaryDto> list() {
        return favoriteService.listFavorites(SecurityUtils.currentUserId());
    }

    @GetMapping("/ids")
    public List<Long> listIds() {
        return favoriteService.listFavoriteIds(SecurityUtils.currentUserId());
    }

    @PostMapping("/{businessId}")
    public ResponseEntity<Void> add(@PathVariable Long businessId) {
        favoriteService.add(SecurityUtils.currentUserId(), businessId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{businessId}")
    public ResponseEntity<Void> remove(@PathVariable Long businessId) {
        favoriteService.remove(SecurityUtils.currentUserId(), businessId);
        return ResponseEntity.noContent().build();
    }
}
