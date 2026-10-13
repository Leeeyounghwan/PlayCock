package com.playcock.live;

import com.playcock.court.Court;
import com.playcock.court.CourtRepository;
import com.playcock.invite.InviteCode;
import com.playcock.match.MatchPlayer;
import com.playcock.match.MatchPlayerRepository;
import com.playcock.match.MatchRepository;
import com.playcock.match.MatchStatus;
import com.playcock.match.PlayMatch;
import com.playcock.participant.ParticipantStatus;
import com.playcock.participant.SessionParticipant;
import com.playcock.participant.SessionParticipantRepository;
import com.playcock.session.PlaySession;
import com.playcock.session.SessionService;
import com.playcock.session.SessionStatus;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LiveService {
    private final SessionService sessionService;
    private final SessionParticipantRepository participantRepository;
    private final CourtRepository courtRepository;
    private final MatchRepository matchRepository;
    private final MatchPlayerRepository matchPlayerRepository;

    public LiveService(
            SessionService sessionService,
            SessionParticipantRepository participantRepository,
            CourtRepository courtRepository,
            MatchRepository matchRepository,
            MatchPlayerRepository matchPlayerRepository
    ) {
        this.sessionService = sessionService;
        this.participantRepository = participantRepository;
        this.courtRepository = courtRepository;
        this.matchRepository = matchRepository;
        this.matchPlayerRepository = matchPlayerRepository;
    }

    @Transactional(readOnly = true)
    public LiveDtos.LiveSnapshotResponse snapshot(Long sessionId) {
        PlaySession session = openSession(sessionId);
        InviteCode inviteCode = sessionService.inviteFor(sessionId);
        List<SessionParticipant> participants = participantRepository.findAllBySessionIdOrderByIdAsc(sessionId);
        List<Court> courts = courtRepository.findAllBySessionIdOrderBySortOrderAscIdAsc(sessionId);
        List<PlayMatch> activeMatches = matchRepository.findAllBySessionIdAndStatusInOrderByCreatedAtAsc(
                sessionId,
                List.of(MatchStatus.READY, MatchStatus.PLAYING)
        );
        Map<Long, List<MatchPlayer>> playersByMatchId = playersByMatchId(activeMatches);
        Map<Long, PlayMatch> playingMatchByCourtId = activeMatches.stream()
                .filter(match -> match.getStatus() == MatchStatus.PLAYING && match.getCourt() != null)
                .collect(Collectors.toMap(match -> match.getCourt().getId(), Function.identity(), (first, ignored) -> first));
        Map<ParticipantStatus, List<LiveDtos.LiveParticipantResponse>> participantGroups = groupParticipants(participants);

        return new LiveDtos.LiveSnapshotResponse(
                new LiveDtos.LiveSessionResponse(
                        session.getId(),
                        session.getName(),
                        session.getSessionDate(),
                        "PlayCock · " + session.getName(),
                        session.getStatus(),
                        inviteCode == null ? null : inviteCode.getCode()
                ),
                participantGroups.getOrDefault(ParticipantStatus.WAITING, List.of()),
                courts.stream().map(court -> courtResponse(court, playingMatchByCourtId, playersByMatchId)).toList(),
                activeMatches.stream()
                        .filter(match -> match.getStatus() == MatchStatus.READY)
                        .map(match -> matchResponse(match, playersByMatchId.getOrDefault(match.getId(), List.of())))
                        .toList(),
                LiveDtos.statusGroups(participantGroups)
        );
    }

    @Transactional(readOnly = true)
    public LiveDtos.QueueBoardResponse queueBoard(Long sessionId) {
        openSession(sessionId);
        Map<ParticipantStatus, List<LiveDtos.LiveParticipantResponse>> participantGroups = groupParticipants(
                participantRepository.findAllBySessionIdOrderByIdAsc(sessionId)
        );
        return new LiveDtos.QueueBoardResponse(
                participantGroups.getOrDefault(ParticipantStatus.WAITING, List.of()),
                LiveDtos.statusGroups(participantGroups)
        );
    }

    private PlaySession openSession(Long sessionId) {
        PlaySession session = sessionService.get(sessionId);
        if (session.getStatus() != SessionStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Live board requires an open session");
        }
        return session;
    }

    private Map<Long, List<MatchPlayer>> playersByMatchId(List<PlayMatch> matches) {
        List<Long> matchIds = matches.stream().map(PlayMatch::getId).toList();
        if (matchIds.isEmpty()) return Map.of();
        return matchPlayerRepository.findAllByMatchIdInOrderByMatchIdAscTeamNoAscSlotNoAsc(matchIds).stream()
                .collect(Collectors.groupingBy(player -> player.getMatch().getId(), Collectors.toList()));
    }

    private Map<ParticipantStatus, List<LiveDtos.LiveParticipantResponse>> groupParticipants(List<SessionParticipant> participants) {
        Map<ParticipantStatus, List<LiveDtos.LiveParticipantResponse>> groups = new EnumMap<>(ParticipantStatus.class);
        participants.stream()
                .map(LiveDtos::participant)
                .forEach(participant -> groups.computeIfAbsent(participant.status(), ignored -> new java.util.ArrayList<>()).add(participant));
        return groups;
    }

    private LiveDtos.LiveCourtResponse courtResponse(
            Court court,
            Map<Long, PlayMatch> playingMatchByCourtId,
            Map<Long, List<MatchPlayer>> playersByMatchId
    ) {
        PlayMatch match = playingMatchByCourtId.get(court.getId());
        if (match == null) {
            return new LiveDtos.LiveCourtResponse(court.getId(), court.getName(), court.getStatus(), null, null, null, null);
        }

        return new LiveDtos.LiveCourtResponse(
                court.getId(),
                court.getName(),
                court.getStatus(),
                match.getId(),
                playersByMatchId.getOrDefault(match.getId(), List.of()).stream()
                        .map(player -> LiveDtos.participantWithStatus(player.getSessionParticipant(), ParticipantStatus.PLAYING))
                        .toList(),
                "00:00",
                match.getStartedAt()
        );
    }

    private LiveDtos.LiveMatchResponse matchResponse(PlayMatch match, List<MatchPlayer> players) {
        return new LiveDtos.LiveMatchResponse(
                match.getId(),
                match.getStatus(),
                match.getCourt() == null ? null : match.getCourt().getName(),
                players.stream()
                        .map(player -> LiveDtos.participantWithStatus(player.getSessionParticipant(), ParticipantStatus.MATCH_READY))
                        .toList()
        );
    }
}
