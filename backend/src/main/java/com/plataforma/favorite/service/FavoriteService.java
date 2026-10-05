package com.plataforma.favorite.service;

import com.plataforma.business.dto.BusinessSummaryDto;
import com.plataforma.business.entity.Business;
import com.plataforma.business.repository.BusinessRepository;
import com.plataforma.business.service.BusinessMapper;
import com.plataforma.common.exception.NotFoundException;
import com.plataforma.favorite.entity.Favorite;
import com.plataforma.favorite.repository.FavoriteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final BusinessRepository businessRepository;
    private final BusinessMapper mapper;

    public FavoriteService(FavoriteRepository favoriteRepository,
                           BusinessRepository businessRepository,
                           BusinessMapper mapper) {
        this.favoriteRepository = favoriteRepository;
        this.businessRepository = businessRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<BusinessSummaryDto> listFavorites(String userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(f -> businessRepository.findById(f.getBusinessId()).orElse(null))
                .filter(b -> b != null)
                .map(b -> mapper.toSummary(b, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Long> listFavoriteIds(String userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(Favorite::getBusinessId).toList();
    }

    @Transactional
    public void add(String userId, Long businessId) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));
        if (favoriteRepository.existsByUserIdAndBusinessId(userId, businessId)) {
            return;
        }
        Favorite f = new Favorite();
        f.setUserId(userId);
        f.setBusinessId(business.getId());
        favoriteRepository.save(f);
    }

    @Transactional
    public void remove(String userId, Long businessId) {
        favoriteRepository.deleteByUserIdAndBusinessId(userId, businessId);
    }
}
