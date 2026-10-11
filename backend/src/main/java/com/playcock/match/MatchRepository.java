package com.playcock.match;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<PlayMatch, Long> {
    @EntityGraph(attributePaths = {"court", "session"})
    List<PlayMatch> findAllBySessionIdAndStatusInOrderByCreatedAtAsc(Long sessionId, Collection<MatchStatus> statuses);

    @EntityGraph(attributePaths = {"court", "session"})
    List<PlayMatch> findAllBySessionIdAndStatusOrderByFinishedAtDescIdDesc(Long sessionId, MatchStatus status);

    long countBySessionIdAndStatus(Long sessionId, MatchStatus status);
}
