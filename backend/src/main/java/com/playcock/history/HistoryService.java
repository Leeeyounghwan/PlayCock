package com.playcock.history;

import com.playcock.live.LiveDtos;
import com.playcock.match.MatchPlayer;
import com.playcock.match.MatchPlayerRepository;
import com.playcock.match.MatchRepository;
import com.playcock.match.MatchStatus;
import com.playcock.match.PlayMatch;
import com.playcock.participant.SessionParticipant;
import com.playcock.participant.SessionParticipantRepository;
import com.playcock.participant.ParticipantStatus;
import com.playcock.session.PlaySession;
import com.playcock.session.SessionService;
import com.playcock.session.SessionStatus;
import java.time.Duration;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HistoryService {
    private final SessionService sessionService;
    private final SessionParticipantRepository participantRepository;
    private final MatchRepository matchRepository;
    private final MatchPlayerRepository matchPlayerRepository;

    public HistoryService(
            SessionService sessionService,
            SessionParticipantRepository participantRepository,
            MatchRepository matchRepository,
            MatchPlayerRepository matchPlayerRepository
    ) {
        this.sessionService = sessionService;
        this.participantRepository = participantRepository;
        this.matchRepository = matchRepository;
        this.matchPlayerRepository = matchPlayerRepository;
    }

    @Transactional(readOnly = true)
    public List<HistoryDtos.SessionHistorySummary> sessions() {
        return sessionService.findAll().stream()
                .filter(session -> session.getStatus() == SessionStatus.CLOSED)
                .map(this::sessionSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public HistoryDtos.SessionHistoryDetail detail(Long sessionId) {
        PlaySession session = sessionService.get(sessionId);
        List<PlayMatch> matches = matchRepository.findAllBySessionIdAndStatusOrderByFinishedAtDescIdDesc(sessionId, MatchStatus.FINISHED);
        Map<Long, List<MatchPlayer>> playersByMatchId = playersByMatchId(matches);
        List<SessionParticipant> participants = participantRepository.findAllBySessionIdOrderByIdAsc(sessionId);

        return new HistoryDtos.SessionHistoryDetail(
                sessionSummary(session, participants),
                sessionStats(participants, matches.size()),
                matches.stream().map(match -> matchRow(match, playersByMatchId.getOrDefault(match.getId(), List.of()))).toList(),
                participants.stream()
                        .map(this::memberSummary)
                        .sorted(Comparator.comparingInt(HistoryDtos.MemberHistorySummary::games).reversed()
                                .thenComparing(HistoryDtos.MemberHistorySummary::name))
                        .toList(),
                courtHistories(matches, playersByMatchId)
        );
    }

    private Map<Long, List<MatchPlayer>> playersByMatchId(List<PlayMatch> matches) {
        List<Long> matchIds = matches.stream().map(PlayMatch::getId).toList();
        if (matchIds.isEmpty()) return Map.of();
        return matchPlayerRepository.findAllByMatchIdInOrderByMatchIdAscTeamNoAscSlotNoAsc(matchIds).stream()
                .collect(Collectors.groupingBy(player -> player.getMatch().getId(), Collectors.toList()));
    }

    private HistoryDtos.SessionHistorySummary sessionSummary(PlaySession session) {
        return sessionSummary(session, participantRepository.findAllBySessionIdOrderByIdAsc(session.getId()));
    }

    private HistoryDtos.SessionHistorySummary sessionSummary(PlaySession session, List<SessionParticipant> participants) {
        return new HistoryDtos.SessionHistorySummary(
                session.getId(),
                session.getSessionDate(),
                session.getName(),
                session.getStatus(),
                matchRepository.countBySessionIdAndStatus(session.getId(), MatchStatus.FINISHED),
                participants.size(),
                participants.stream().filter(participant -> participant.getStatus() == ParticipantStatus.ABSENT).count(),
                participants.stream().filter(participant -> participant.getStatus() == ParticipantStatus.NOT_ARRIVED).count()
        );
    }

    private HistoryDtos.SessionHistoryStats sessionStats(List<SessionParticipant> participants, long matchCount) {
        return new HistoryDtos.SessionHistoryStats(
                participants.size(),
                participants.stream().filter(participant -> participant.getGameCount() > 0).count(),
                matchCount,
                participants.stream().filter(participant -> participant.getStatus() == ParticipantStatus.ABSENT).count(),
                participants.stream().filter(participant -> participant.getStatus() == ParticipantStatus.NOT_ARRIVED).count(),
                participants.stream()
                        .filter(participant -> participant.getStatus() != ParticipantStatus.ABSENT)
                        .filter(participant -> participant.getStatus() != ParticipantStatus.NOT_ARRIVED)
                        .filter(participant -> participant.getGameCount() == 0)
                        .count()
        );
    }

    private HistoryDtos.MatchHistoryRow matchRow(PlayMatch match, List<MatchPlayer> players) {
        long durationSeconds = match.getStartedAt() != null && match.getFinishedAt() != null
                ? Math.max(0, Duration.between(match.getStartedAt(), match.getFinishedAt()).toSeconds())
                : 0;

        return new HistoryDtos.MatchHistoryRow(
                match.getId(),
                match.getCourt() == null ? null : match.getCourt().getName(),
                match.getStartedAt(),
                match.getFinishedAt(),
                durationSeconds,
                players.stream().filter(player -> player.getTeamNo() == 1).map(this::matchPlayerSummary).toList(),
                players.stream().filter(player -> player.getTeamNo() == 2).map(this::matchPlayerSummary).toList()
        );
    }

    private HistoryDtos.MatchPlayerSummary matchPlayerSummary(MatchPlayer player) {
        SessionParticipant participant = player.getSessionParticipant();
        return new HistoryDtos.MatchPlayerSummary(
                participant.getId(),
                participant.getMember().getName(),
                LiveDtos.gradeLabel(player.getGradeSnapshot()),
                participant.getGameCount()
        );
    }

    private HistoryDtos.MemberHistorySummary memberSummary(SessionParticipant participant) {
        return new HistoryDtos.MemberHistorySummary(
                participant.getId(),
                participant.getMember().getId(),
                participant.getMember().getName(),
                LiveDtos.gradeLabel(participant.getGradeSnapshot()),
                participant.getStatus(),
                attendanceLabel(participant),
                participant.getGameCount(),
                participant.getCheckedInAt(),
                participant.getLastMatchEndedAt()
        );
    }

    private String attendanceLabel(SessionParticipant participant) {
        if (participant.getStatus() == ParticipantStatus.ABSENT) return "불참";
        if (participant.getStatus() == ParticipantStatus.NOT_ARRIVED) return "미참석";
        if (participant.getGameCount() == 0) return "경기 없음";
        return "정상 참여";
    }

    private List<HistoryDtos.CourtHistorySummary> courtHistories(
            List<PlayMatch> matches,
            Map<Long, List<MatchPlayer>> playersByMatchId
    ) {
        Map<String, List<HistoryDtos.MatchHistoryRow>> matchesByCourt = matches.stream()
                .map(match -> matchRow(match, playersByMatchId.getOrDefault(match.getId(), List.of())))
                .collect(Collectors.groupingBy(
                        row -> row.courtName() == null ? "코트 미지정" : row.courtName(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return matchesByCourt.entrySet().stream()
                .map(entry -> new HistoryDtos.CourtHistorySummary(
                        entry.getKey(),
                        entry.getValue().size(),
                        entry.getValue().stream().mapToLong(HistoryDtos.MatchHistoryRow::durationSeconds).sum(),
                        entry.getValue()
                ))
                .toList();
    }
}
