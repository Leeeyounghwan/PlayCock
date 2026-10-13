package com.playcock.session;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaySessionRepository extends JpaRepository<PlaySession, Long> {
    List<PlaySession> findAllByOrderBySessionDateDescIdDesc();

    List<PlaySession> findAllByStatusAndSessionDateGreaterThanEqualAndSessionDateLessThanOrderBySessionDateAscIdAsc(
            SessionStatus status,
            LocalDate startDate,
            LocalDate endDate
    );
}
