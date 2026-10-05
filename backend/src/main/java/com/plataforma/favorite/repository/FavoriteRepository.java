package com.plataforma.favorite.repository;

import com.plataforma.favorite.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(String userId);
    Optional<Favorite> findByUserIdAndBusinessId(String userId, Long businessId);
    boolean existsByUserIdAndBusinessId(String userId, Long businessId);
    void deleteByUserIdAndBusinessId(String userId, Long businessId);
}
