package com.plataforma.user.service;

import com.plataforma.common.UserRole;
import com.plataforma.security.AuthUser;
import com.plataforma.user.dto.ProfileDto;
import com.plataforma.user.dto.ProfileRequest;
import com.plataforma.user.entity.Profile;
import com.plataforma.user.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional
    public ProfileDto getOrCreate(AuthUser user) {
        Profile profile = profileRepository.findByUserId(user.userId())
                .orElseGet(() -> {
                    Profile p = new Profile();
                    p.setUserId(user.userId());
                    p.setEmail(user.email() != null ? user.email() : "");
                    p.setName(deriveName(user.email()));
                    p.setRole(UserRole.CUSTOMER);
                    return profileRepository.save(p);
                });
        return toDto(profile);
    }

    @Transactional
    public ProfileDto update(AuthUser user, ProfileRequest req) {
        Profile profile = profileRepository.findByUserId(user.userId())
                .orElseGet(() -> {
                    Profile p = new Profile();
                    p.setUserId(user.userId());
                    return p;
                });
        profile.setName(req.name());
        if (req.email() != null && !req.email().isBlank()) {
            profile.setEmail(req.email());
        } else if (profile.getEmail() == null) {
            profile.setEmail(user.email() != null ? user.email() : "");
        }
        profile.setPhone(req.phone());
        profile.setAvatarUrl(req.avatarUrl());
        if (req.role() != null) {
            profile.setRole(req.role());
        } else if (profile.getRole() == null) {
            profile.setRole(UserRole.CUSTOMER);
        }
        profileRepository.save(profile);
        return toDto(profile);
    }

    private String deriveName(String email) {
        if (email == null || email.isBlank()) {
            return "Usuário";
        }
        String local = email.split("@")[0];
        return local.substring(0, 1).toUpperCase() + local.substring(1);
    }

    private ProfileDto toDto(Profile p) {
        return new ProfileDto(p.getId(), p.getUserId(), p.getName(), p.getEmail(),
                p.getPhone(), p.getAvatarUrl(), p.getRole());
    }
}
