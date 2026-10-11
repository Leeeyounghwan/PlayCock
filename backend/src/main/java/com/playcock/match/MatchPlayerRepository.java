package com.playcock.match;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchPlayerRepository extends JpaRepository<MatchPlayer, Long> {
    @EntityGraph(attributePaths = {"sessionParticipant", "sessionParticipant.member"})
    List<MatchPlayer> findAllByMatchIdOrderByTeamNoAscSlotNoAsc(Long matchId);

    @EntityGraph(attributePaths = {"sessionParticipant", "sessionParticipant.member"})
    List<MatchPlayer> findAllByMatchIdInOrderByMatchIdAscTeamNoAscSlotNoAsc(Collection<Long> matchIds);

    boolean existsBySessionParticipantId(Long sessionParticipantId);
}
