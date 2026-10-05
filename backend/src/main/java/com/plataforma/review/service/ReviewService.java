package com.plataforma.review.service;

import com.plataforma.business.entity.Business;
import com.plataforma.business.repository.BusinessRepository;
import com.plataforma.common.exception.NotFoundException;
import com.plataforma.review.dto.ReviewDto;
import com.plataforma.review.dto.ReviewRequest;
import com.plataforma.review.entity.Review;
import com.plataforma.review.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BusinessRepository businessRepository;

    public ReviewService(ReviewRepository reviewRepository, BusinessRepository businessRepository) {
        this.reviewRepository = reviewRepository;
        this.businessRepository = businessRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewDto> list(Long businessId) {
        return reviewRepository.findByBusinessIdOrderByCreatedAtDesc(businessId).stream()
                .map(this::toDto).toList();
    }

    /**
     * Creates or updates the current user's review for a business.
     * Each user can keep a single review per business (upsert), which prevents
     * repeated reviews from inflating the rating.
     */
    @Transactional
    public ReviewDto submit(String userId, Long businessId, ReviewRequest req) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new NotFoundException("Negócio não encontrado."));

        Review review = reviewRepository.findByBusinessIdAndUserId(businessId, userId)
                .orElseGet(() -> {
                    Review r = new Review();
                    r.setBusinessId(businessId);
                    r.setUserId(userId);
                    return r;
                });
        review.setRating(req.rating());
        review.setComment(req.comment());
        reviewRepository.save(review);

        recalculateRating(business);
        return toDto(review);
    }

    @Transactional
    public void delete(String userId, Long businessId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException("Avaliação não encontrada."));
        if (!review.getUserId().equals(userId) || !review.getBusinessId().equals(businessId)) {
            throw new NotFoundException("Avaliação não encontrada.");
        }
        reviewRepository.delete(review);
        businessRepository.findById(businessId).ifPresent(this::recalculateRating);
    }

    private void recalculateRating(Business business) {
        List<Review> all = reviewRepository.findByBusinessId(business.getId());
        if (all.isEmpty()) {
            business.setRating(0d);
            business.setTotalReviews(0);
        } else {
            double avg = all.stream().mapToInt(Review::getRating).average().orElse(0);
            business.setRating(Math.round(avg * 10.0) / 10.0);
            business.setTotalReviews(all.size());
        }
        businessRepository.save(business);
    }

    private ReviewDto toDto(Review r) {
        return new ReviewDto(r.getId(), r.getBusinessId(), r.getUserId(), r.getRating(), r.getComment(), r.getCreatedAt());
    }
}
