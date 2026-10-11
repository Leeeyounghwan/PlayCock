package com.playcock.session;

import com.playcock.invite.InviteCode;
import com.playcock.invite.InviteCodeRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SessionService {
    private final PlaySessionRepository sessionRepository;
    private final InviteCodeRepository inviteCodeRepository;

    public SessionService(PlaySessionRepository sessionRepository, InviteCodeRepository inviteCodeRepository) {
        this.sessionRepository = sessionRepository;
        this.inviteCodeRepository = inviteCodeRepository;
    }

    @Transactional
    public PlaySession create(SessionDtos.SessionRequest request) {
        PlaySession session = sessionRepository.save(new PlaySession(request.sessionDate(), request.name()));
        inviteCodeRepository.save(new InviteCode(session, newCode(), Instant.now().plus(1, ChronoUnit.DAYS)));
        return session;
    }

    @Transactional(readOnly = true)
    public List<PlaySession> findAll() {
        return sessionRepository.findAllByOrderBySessionDateDescIdDesc();
    }

    @Transactional(readOnly = true)
    public PlaySession get(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
    }

    @Transactional(readOnly = true)
    public InviteCode inviteFor(Long sessionId) {
        return inviteCodeRepository.findFirstBySessionIdAndActiveTrueOrderByIdDesc(sessionId).orElse(null);
    }

    @Transactional
    public InviteCode regenerateInvite(Long sessionId) {
        PlaySession session = get(sessionId);
        inviteCodeRepository.findFirstBySessionIdAndActiveTrueOrderByIdDesc(sessionId)
                .ifPresent(InviteCode::deactivate);
        return inviteCodeRepository.save(new InviteCode(session, newCode(), Instant.now().plus(1, ChronoUnit.DAYS)));
    }

    @Transactional
    public PlaySession open(Long id) {
        PlaySession session = get(id);
        session.open();
        return session;
    }

    @Transactional
    public PlaySession close(Long id) {
        PlaySession session = get(id);
        session.close();
        return session;
    }

    private String newCode() {
        String code;
        do {
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        } while (inviteCodeRepository.existsByCode(code));
        return code;
    }
}
