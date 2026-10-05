package com.plataforma.review.controller;

import com.plataforma.review.dto.ReviewDto;
import com.plataforma.review.dto.ReviewRequest;
import com.plataforma.review.service.ReviewService;
import com.plataforma.security.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/businesses/{businessId}/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<ReviewDto> list(@PathVariable Long businessId) {
        return reviewService.list(businessId);
    }

    @PostMapping
    public ResponseEntity<ReviewDto> submit(@PathVariable Long businessId,
                                            @Valid @RequestBody ReviewRequest req) {
        ReviewDto dto = reviewService.submit(SecurityUtils.currentUserId(), businessId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> delete(@PathVariable Long businessId, @PathVariable Long reviewId) {
        reviewService.delete(SecurityUtils.currentUserId(), businessId, reviewId);
        return ResponseEntity.noContent().build();
    }
}
