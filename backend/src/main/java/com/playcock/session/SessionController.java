package com.playcock.session;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/sessions")
public class SessionController {
    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping
    SessionDtos.SessionResponse create(@Valid @RequestBody SessionDtos.SessionRequest request) {
        PlaySession session = sessionService.create(request);
        return SessionDtos.SessionResponse.from(session, sessionService.inviteFor(session.getId()));
    }

    @GetMapping
    List<SessionDtos.SessionResponse> findAll() {
        return sessionService.findAll().stream()
                .map(session -> SessionDtos.SessionResponse.from(session, sessionService.inviteFor(session.getId())))
                .toList();
    }

    @GetMapping("/{id}")
    SessionDtos.SessionResponse get(@PathVariable Long id) {
        PlaySession session = sessionService.get(id);
        return SessionDtos.SessionResponse.from(session, sessionService.inviteFor(id));
    }

    @PostMapping("/{id}/open")
    SessionDtos.SessionResponse open(@PathVariable Long id) {
        PlaySession session = sessionService.open(id);
        return SessionDtos.SessionResponse.from(session, sessionService.inviteFor(id));
    }

    @PostMapping("/{id}/close")
    SessionDtos.SessionResponse close(@PathVariable Long id) {
        PlaySession session = sessionService.close(id);
        return SessionDtos.SessionResponse.from(session, sessionService.inviteFor(id));
    }

    @PostMapping("/{id}/invite-code")
    SessionDtos.SessionResponse regenerateInvite(@PathVariable Long id) {
        sessionService.regenerateInvite(id);
        PlaySession session = sessionService.get(id);
        return SessionDtos.SessionResponse.from(session, sessionService.inviteFor(id));
    }
}
