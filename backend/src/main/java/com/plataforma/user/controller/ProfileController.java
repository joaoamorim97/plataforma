package com.plataforma.user.controller;

import com.plataforma.security.SecurityUtils;
import com.plataforma.user.dto.ProfileDto;
import com.plataforma.user.dto.ProfileRequest;
import com.plataforma.user.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /** Returns the current user's profile, creating a default one on first access. */
    @GetMapping("/me")
    public ProfileDto me() {
        return profileService.getOrCreate(SecurityUtils.requireUser());
    }

    @PutMapping("/me")
    public ProfileDto update(@Valid @RequestBody ProfileRequest req) {
        return profileService.update(SecurityUtils.requireUser(), req);
    }
}
