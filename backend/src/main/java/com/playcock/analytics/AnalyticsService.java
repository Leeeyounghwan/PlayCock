package com.playcock.analytics;

import com.playcock.live.LiveDtos;
import com.playcock.match.MatchPlayer;
import com.playcock.match.MatchPlayerRepository;
import com.playcock.match.MatchRepository;
import com.playcock.match.MatchStatus;
import com.playcock.match.PlayMatch;
import com.playcock.participant.ParticipantStatus;
import com.playcock.participant.SessionParticipant;
import com.playcock.participant.SessionParticipantRepository;
import com.playcock.session.PlaySession;
import com.playcock.session.PlaySessionRepository;
import com.playcock.session.SessionStatus;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {
    private final PlaySessionRepository sessionRepository;
    private final SessionParticipantRepository participantRepository;
    private final MatchRepository matchRepository;
    private final MatchPlayerRepository matchPlayerRepository;

    public AnalyticsService(
            PlaySessionRepository sessionRepository,
            SessionParticipantRepository participantRepository,
            MatchRepository matchRepository,
            MatchPlayerRepository matchPlayerRepository
    ) {
        this.sessionRepository = sessionRepository;
        this.participantRepository = participantRepository;
        this.matchRepository = matchRepository;
        this.matchPlayerRepository = matchPlayerRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsDtos.MonthlyAnalyticsResponse monthly(YearMonth month) {
        LocalDate startDate = month.atDay(1);
        LocalDate endDate = month.plusMonths(1).atDay(1);
        List<PlaySession> sessions = sessionRepository.findAllByStatusAndSessionDateGreaterThanEqualAndSessionDateLessThanOrderBySessionDateAscIdAsc(
                SessionStatus.CLOSED,
                startDate,
                endDate
        );
        List<Long> sessionIds = sessions.stream().map(PlaySession::getId).toList();
        List<SessionParticipant> participants = sessionIds.isEmpty()
                ? List.of()
                : participantRepository.findAllBySessionIdIn(sessionIds).stream()
                        .sorted(Comparator.comparing((SessionParticipant participant) -> participant.getSession().getSessionDate())
                                .thenComparing(SessionParticipant::getId))
                        .toList();
        List<PlayMatch> matches = sessionIds.isEmpty()
                ? List.of()
                : matchRepository.findAllBySessionIdInAndStatusOrderByFinishedAtAscIdAsc(sessionIds, MatchStatus.FINISHED);
        Map<Long, Long> matchCountBySessionId = matches.stream()
                .collect(Collectors.groupingBy(match -> match.getSession().getId(), Collectors.counting()));

        return new AnalyticsDtos.MonthlyAnalyticsResponse(
                month.toString(),
                summary(sessions, participants, matches),
                memberStats(participants),
                sessionStats(sessions, participants, matchCountBySessionId),
                partnerPairs(matches)
        );
    }

    private AnalyticsDtos.MonthlySummary summary(
            List<PlaySession> sessions,
            List<SessionParticipant> participants,
            List<PlayMatch> matches
    ) {
        return new AnalyticsDtos.MonthlySummary(
                sessions.size(),
                participants.size(),
                participants.stream().filter(participant -> participant.getGameCount() > 0).count(),
                matches.size(),
                participants.stream().filter(participant -> participant.getStatus() == ParticipantStatus.ABSENT).count(),
                participants.stream().filter(participant -> participant.getStatus() == ParticipantStatus.NOT_ARRIVED).count(),
                participants.stream().filter(this::isNoGame).count()
        );
    }

    private List<AnalyticsDtos.MemberMonthlyStat> memberStats(List<SessionParticipant> participants) {
        Map<Long, MemberAccumulator> stats = new HashMap<>();
        participants.forEach(participant -> stats.computeIfAbsent(
                participant.getMember().getId(),
                ignored -> new MemberAccumulator(
                        participant.getMember().getId(),
                        participant.getMember().getName(),
                        LiveDtos.gradeLabel(participant.getGradeSnapshot())
                )
        ).add(participant));

        return stats.values().stream()
                .map(MemberAccumulator::toResponse)
                .sorted(Comparator.comparingLong(AnalyticsDtos.MemberMonthlyStat::gameCount).reversed()
                        .thenComparing(AnalyticsDtos.MemberMonthlyStat::sessionCount, Comparator.reverseOrder())
                        .thenComparing(AnalyticsDtos.MemberMonthlyStat::name))
                .toList();
    }

    private List<AnalyticsDtos.SessionMonthlyStat> sessionStats(
            List<PlaySession> sessions,
            List<SessionParticipant> participants,
            Map<Long, Long> matchCountBySessionId
    ) {
        Map<Long, List<SessionParticipant>> participantsBySession = participants.stream()
                .collect(Collectors.groupingBy(participant -> participant.getSession().getId()));

        return sessions.stream()
                .map(session -> {
                    List<SessionParticipant> sessionParticipants = participantsBySession.getOrDefault(session.getId(), List.of());
                    return new AnalyticsDtos.SessionMonthlyStat(
                            session.getId(),
                            session.getSessionDate(),
                            session.getName(),
                            sessionParticipants.size(),
                            sessionParticipants.stream().filter(participant -> participant.getGameCount() > 0).count(),
                            matchCountBySessionId.getOrDefault(session.getId(), 0L),
                            sessionParticipants.stream().filter(participant -> participant.getStatus() == ParticipantStatus.ABSENT).count(),
                            sessionParticipants.stream().filter(participant -> participant.getStatus() == ParticipantStatus.NOT_ARRIVED).count(),
                            sessionParticipants.stream().filter(this::isNoGame).count()
                    );
                })
                .toList();
    }

    private List<AnalyticsDtos.PairMonthlyStat> partnerPairs(List<PlayMatch> matches) {
        List<Long> matchIds = matches.stream().map(PlayMatch::getId).toList();
        if (matchIds.isEmpty()) return List.of();

        Map<Long, List<MatchPlayer>> playersByMatch = matchPlayerRepository.findAllByMatchIdInOrderByMatchIdAscTeamNoAscSlotNoAsc(matchIds).stream()
                .collect(Collectors.groupingBy(player -> player.getMatch().getId()));
        Map<String, Long> pairCounts = new HashMap<>();

        playersByMatch.values().forEach(players -> players.stream()
                .collect(Collectors.groupingBy(MatchPlayer::getTeamNo))
                .values()
                .forEach(teamPlayers -> partnerPairLabels(teamPlayers).forEach(label -> pairCounts.merge(label, 1L, Long::sum))));

        return pairCounts.entrySet().stream()
                .map(entry -> new AnalyticsDtos.PairMonthlyStat(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingLong(AnalyticsDtos.PairMonthlyStat::count).reversed()
                        .thenComparing(AnalyticsDtos.PairMonthlyStat::label))
                .limit(8)
                .toList();
    }

    private List<String> partnerPairLabels(List<MatchPlayer> players) {
        List<MatchPlayer> sortedPlayers = players.stream()
                .sorted(Comparator.comparing(player -> player.getSessionParticipant().getMember().getName()))
                .toList();
        List<String> labels = new ArrayList<>();

        for (int first = 0; first < sortedPlayers.size(); first += 1) {
            for (int second = first + 1; second < sortedPlayers.size(); second += 1) {
                labels.add(label(sortedPlayers.get(first)) + " · " + label(sortedPlayers.get(second)));
            }
        }
        return labels;
    }

    private String label(MatchPlayer player) {
        SessionParticipant participant = player.getSessionParticipant();
        return participant.getMember().getName() + " " + LiveDtos.gradeLabel(player.getGradeSnapshot());
    }

    private boolean isNoGame(SessionParticipant participant) {
        return participant.getStatus() != ParticipantStatus.ABSENT
                && participant.getStatus() != ParticipantStatus.NOT_ARRIVED
                && participant.getGameCount() == 0;
    }

    private static final class MemberAccumulator {
        private final Long memberId;
        private final String name;
        private final String grade;
        private long sessionCount;
        private long gameCount;
        private long absentCount;
        private long notArrivedCount;
        private long noGameCount;
        private LocalDate lastSessionDate;

        private MemberAccumulator(Long memberId, String name, String grade) {
            this.memberId = memberId;
            this.name = name;
            this.grade = grade;
        }

        private void add(SessionParticipant participant) {
            sessionCount += 1;
            gameCount += participant.getGameCount();
            if (participant.getStatus() == ParticipantStatus.ABSENT) absentCount += 1;
            if (participant.getStatus() == ParticipantStatus.NOT_ARRIVED) notArrivedCount += 1;
            if (participant.getStatus() != ParticipantStatus.ABSENT
                    && participant.getStatus() != ParticipantStatus.NOT_ARRIVED
                    && participant.getGameCount() == 0) {
                noGameCount += 1;
            }
            LocalDate sessionDate = participant.getSession().getSessionDate();
            if (lastSessionDate == null || sessionDate.isAfter(lastSessionDate)) {
                lastSessionDate = sessionDate;
            }
        }

        private AnalyticsDtos.MemberMonthlyStat toResponse() {
            return new AnalyticsDtos.MemberMonthlyStat(
                    memberId,
                    name,
                    grade,
                    sessionCount,
                    gameCount,
                    absentCount,
                    notArrivedCount,
                    noGameCount,
                    lastSessionDate
            );
        }
    }
}
