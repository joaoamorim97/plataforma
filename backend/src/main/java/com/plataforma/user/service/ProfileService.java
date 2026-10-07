package com.plataforma.user.service;

import com.plataforma.business.entity.Business;
import com.plataforma.business.repository.BusinessRepository;
import com.plataforma.common.UserRole;
import com.plataforma.security.AdminProperties;
import com.plataforma.security.AuthUser;
import com.plataforma.user.dto.ProfileDto;
import com.plataforma.user.dto.ProfileRequest;
import com.plataforma.user.entity.Profile;
import com.plataforma.user.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final BusinessRepository businessRepository;
    private final AdminProperties adminProperties;

    public ProfileService(ProfileRepository profileRepository,
                          BusinessRepository businessRepository,
                          AdminProperties adminProperties) {
        this.profileRepository = profileRepository;
        this.businessRepository = businessRepository;
        this.adminProperties = adminProperties;
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

        // Promove a ADMIN se o e-mail estiver na lista de administradores.
        if (adminProperties.isAdmin(effectiveEmail(profile, user)) && profile.getRole() != UserRole.ADMIN) {
            profile.setRole(UserRole.ADMIN);
            profileRepository.save(profile);
        }

        // Reivindica negócios atribuídos a este e-mail (criados pelo admin).
        claimPendingBusinesses(profile, user);

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
        // Admin por e-mail sempre prevalece.
        if (adminProperties.isAdmin(effectiveEmail(profile, user))) {
            profile.setRole(UserRole.ADMIN);
        }
        profileRepository.save(profile);
        claimPendingBusinesses(profile, user);
        return toDto(profile);
    }

    /**
     * Vincula ao usuário atual todos os negócios que foram atribuídos ao seu e-mail
     * (owner_email) mas ainda não têm owner_id. Se o usuário recebeu um negócio e ainda
     * é CUSTOMER, promove para BUSINESS_OWNER.
     */
    private void claimPendingBusinesses(Profile profile, AuthUser user) {
        String email = effectiveEmail(profile, user);
        if (email == null || email.isBlank()) {
            return;
        }
        List<Business> pending = businessRepository.findByOwnerEmailIgnoreCaseAndOwnerIdIsNull(email);
        if (pending.isEmpty()) {
            return;
        }
        for (Business b : pending) {
            b.setOwnerId(user.userId());
        }
        businessRepository.saveAll(pending);
        if (profile.getRole() == UserRole.CUSTOMER) {
            profile.setRole(UserRole.BUSINESS_OWNER);
            profileRepository.save(profile);
        }
    }

    private String effectiveEmail(Profile profile, AuthUser user) {
        if (profile.getEmail() != null && !profile.getEmail().isBlank()) {
            return profile.getEmail();
        }
        return user.email();
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
