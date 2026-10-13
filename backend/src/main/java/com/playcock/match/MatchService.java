package com.playcock.match;

import com.playcock.court.Court;
import com.playcock.court.CourtRepository;
import com.playcock.court.CourtStatus;
import com.playcock.live.LiveDtos;
import com.playcock.participant.ParticipantStatus;
import com.playcock.participant.SessionParticipant;
import com.playcock.participant.SessionParticipantRepository;
import com.playcock.session.PlaySession;
import com.playcock.session.SessionService;
import com.playcock.session.SessionStatus;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MatchService {
    private final MatchRepository matchRepository;
    private final MatchPlayerRepository matchPlayerRepository;
    private final SessionParticipantRepository participantRepository;
    private final CourtRepository courtRepository;
    private final SessionService sessionService;

    public MatchService(
            MatchRepository matchRepository,
            MatchPlayerRepository matchPlayerRepository,
            SessionParticipantRepository participantRepository,
            CourtRepository courtRepository,
            SessionService sessionService
    ) {
        this.matchRepository = matchRepository;
        this.matchPlayerRepository = matchPlayerRepository;
        this.participantRepository = participantRepository;
        this.courtRepository = courtRepository;
        this.sessionService = sessionService;
    }

    @Transactional
    public LiveDtos.LiveMatchResponse createWaitingMatch(Long sessionId, List<Long> participantIds) {
        if (participantIds.size() != 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doubles match requires exactly 4 participants");
        }
        if (participantIds.stream().distinct().count() != 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participants must be unique");
        }

        PlaySession session = sessionService.get(sessionId);
        if (session.getStatus() != SessionStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Matches can only be created for open sessions");
        }
        List<SessionParticipant> participants = participantIds.stream()
                .map(this::participant)
                .toList();
        participants.forEach(participant -> validateWaitingParticipant(sessionId, participant));

        PlayMatch match = matchRepository.save(new PlayMatch(session, MatchType.OPEN_DOUBLES));
        for (int index = 0; index < participants.size(); index += 1) {
            SessionParticipant participant = participants.get(index);
            participant.changeStatus(ParticipantStatus.MATCH_READY);
            matchPlayerRepository.save(new MatchPlayer(match, participant, index < 2 ? 1 : 2, index % 2 + 1, participant.getGradeSnapshot()));
        }

        return response(match, matchPlayerRepository.findAllByMatchIdOrderByTeamNoAscSlotNoAsc(match.getId()));
    }

    @Transactional
    public void cancelWaitingMatch(Long matchId) {
        PlayMatch match = match(matchId);
        if (match.getStatus() != MatchStatus.READY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only ready matches can be cancelled");
        }

        List<MatchPlayer> players = matchPlayerRepository.findAllByMatchIdOrderByTeamNoAscSlotNoAsc(matchId);
        players.forEach(player -> player.getSessionParticipant().changeStatus(ParticipantStatus.WAITING));
        match.cancel();
    }

    @Transactional
    public LiveDtos.LiveMatchResponse startMatch(Long matchId, Long courtId) {
        PlayMatch match = match(matchId);
        if (match.getStatus() != MatchStatus.READY) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only ready matches can be started");
        }

        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Court not found"));
        if (!court.getSession().getId().equals(match.getSession().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Court belongs to another session");
        }
        if (court.getStatus() != CourtStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Court is not assignable");
        }

        Instant startedAt = Instant.now();
        match.start(court, startedAt);
        court.markInUse();
        List<MatchPlayer> players = matchPlayerRepository.findAllByMatchIdOrderByTeamNoAscSlotNoAsc(matchId);
        players.forEach(player -> player.getSessionParticipant().changeStatus(ParticipantStatus.PLAYING));
        return response(match, players);
    }

    @Transactional
    public LiveDtos.LiveMatchResponse finishMatch(Long matchId) {
        PlayMatch match = match(matchId);
        if (match.getStatus() != MatchStatus.PLAYING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only playing matches can be finished");
        }

        Instant finishedAt = Instant.now();
        match.finish(finishedAt);
        if (match.getCourt() != null) {
            match.getCourt().markOpen();
        }
        List<MatchPlayer> players = matchPlayerRepository.findAllByMatchIdOrderByTeamNoAscSlotNoAsc(matchId);
        players.forEach(player -> player.getSessionParticipant().completeMatch(finishedAt));
        return response(match, players);
    }

    private void validateWaitingParticipant(Long sessionId, SessionParticipant participant) {
        if (!participant.getSession().getId().equals(sessionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant belongs to another session");
        }
        if (participant.getStatus() != ParticipantStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only waiting participants can enter a match");
        }
    }

    private SessionParticipant participant(Long participantId) {
        return participantRepository.findWithMemberById(participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));
    }

    private PlayMatch match(Long matchId) {
        return matchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found"));
    }

    private LiveDtos.LiveMatchResponse response(PlayMatch match, List<MatchPlayer> players) {
        return new LiveDtos.LiveMatchResponse(
                match.getId(),
                match.getStatus(),
                match.getCourt() == null ? null : match.getCourt().getName(),
                players.stream().map(player -> LiveDtos.participant(player.getSessionParticipant())).toList()
        );
    }
}
