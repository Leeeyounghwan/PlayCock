package com.playcock.participant;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionParticipantRepository extends JpaRepository<SessionParticipant, Long> {
    @EntityGraph(attributePaths = "member")
    Optional<SessionParticipant> findWithMemberById(Long id);

    @EntityGraph(attributePaths = "member")
    List<SessionParticipant> findAllBySessionIdOrderByIdAsc(Long sessionId);

    @EntityGraph(attributePaths = {"member", "session"})
    List<SessionParticipant> findAllBySessionIdIn(List<Long> sessionIds);

    @EntityGraph(attributePaths = "member")
    Optional<SessionParticipant> findBySessionIdAndMemberId(Long sessionId, Long memberId);
}
