package com.playcock.court;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourtRepository extends JpaRepository<Court, Long> {
    List<Court> findAllBySessionIdOrderBySortOrderAscIdAsc(Long sessionId);
}
