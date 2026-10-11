package com.playcock.invite;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/view")
public class ViewAccessController {
    private final InviteCodeRepository inviteCodeRepository;

    public ViewAccessController(InviteCodeRepository inviteCodeRepository) {
        this.inviteCodeRepository = inviteCodeRepository;
    }

    @PostMapping("/access")
    @Transactional(readOnly = true)
    ViewAccessResponse access(@Valid @RequestBody ViewAccessRequest request) {
        InviteCode inviteCode = inviteCodeRepository.findByCodeAndActiveTrue(request.code())
                .filter(code -> code.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite code not found"));
        return new ViewAccessResponse(inviteCode.getSession().getId());
    }

    record ViewAccessRequest(@NotBlank String code) {
    }

    record ViewAccessResponse(Long sessionId) {
    }
}
