package com.playcock.court;

import com.playcock.session.PlaySession;
import com.playcock.session.SessionService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CourtService {
    private final CourtRepository courtRepository;
    private final SessionService sessionService;

    public CourtService(CourtRepository courtRepository, SessionService sessionService) {
        this.courtRepository = courtRepository;
        this.sessionService = sessionService;
    }

    @Transactional
    public Court create(Long sessionId, CourtDtos.CourtRequest request) {
        validateManageableStatus(request.status());
        PlaySession session = sessionService.get(sessionId);
        Court court = new Court(session, request.name(), request.sortOrder());
        court.update(request.name(), request.sortOrder(), request.status());
        return courtRepository.save(court);
    }

    @Transactional(readOnly = true)
    public List<Court> findBySession(Long sessionId) {
        return courtRepository.findAllBySessionIdOrderBySortOrderAscIdAsc(sessionId);
    }

    @Transactional
    public Court update(Long courtId, CourtDtos.CourtRequest request) {
        validateManageableStatus(request.status());
        Court court = get(courtId);
        if (court.getStatus() == CourtStatus.IN_USE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Court in use cannot be managed");
        }
        court.update(request.name(), request.sortOrder(), request.status());
        return court;
    }

    @Transactional
    public void delete(Long courtId) {
        Court court = get(courtId);
        if (court.getStatus() == CourtStatus.IN_USE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Court in use cannot be deleted");
        }
        courtRepository.delete(court);
    }

    private void validateManageableStatus(CourtStatus status) {
        if (status == CourtStatus.IN_USE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Court in use status is managed by matches");
        }
    }

    @Transactional(readOnly = true)
    public Court get(Long courtId) {
        return courtRepository.findById(courtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Court not found"));
    }
}
