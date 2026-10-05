package com.plataforma.review.repository;

import com.plataforma.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByBusinessIdOrderByCreatedAtDesc(Long businessId);
    Optional<Review> findByBusinessIdAndUserId(Long businessId, String userId);
    List<Review> findByBusinessId(Long businessId);
}
