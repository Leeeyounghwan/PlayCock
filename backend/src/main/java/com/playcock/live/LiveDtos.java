package com.playcock.live;

import com.playcock.court.CourtStatus;
import com.playcock.member.Gender;
import com.playcock.member.Grade;
import com.playcock.match.MatchStatus;
import com.playcock.participant.ParticipantStatus;
import com.playcock.participant.SessionParticipant;
import com.playcock.session.SessionStatus;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class LiveDtos {
    private LiveDtos() {
    }

    public record LiveSessionResponse(
            Long id,
            String name,
            LocalDate date,
            String title,
            SessionStatus status,
            String inviteCode
    ) {
    }

    public record LiveParticipantResponse(
            Long id,
            Long memberId,
            String name,
            String grade,
            ParticipantStatus status,
            int games,
            long waitMinutes,
            String ageBand,
            String gender,
            Instant checkedInAt,
            Instant lastMatchEndedAt
    ) {
    }

    public record LiveCourtResponse(
            Long id,
            String name,
            CourtStatus status,
            Long matchId,
            List<LiveParticipantResponse> players,
            String elapsed,
            Instant startedAt
    ) {
    }

    public record LiveMatchResponse(
            Long id,
            MatchStatus status,
            String courtName,
            List<LiveParticipantResponse> players
    ) {
    }

    public record LiveStatusGroupsResponse(
            List<LiveParticipantResponse> rest,
            List<LiveParticipantResponse> lesson,
            List<LiveParticipantResponse> notArrived,
            List<LiveParticipantResponse> absent
    ) {
    }

    public record LiveSnapshotResponse(
            LiveSessionResponse session,
            List<LiveParticipantResponse> queue,
            List<LiveCourtResponse> courts,
            List<LiveMatchResponse> waitingMatches,
            LiveStatusGroupsResponse statusGroups
    ) {
    }

    public record QueueBoardResponse(
            List<LiveParticipantResponse> queue,
            LiveStatusGroupsResponse statusGroups
    ) {
    }

    public static String gradeLabel(Grade grade) {
        return switch (grade) {
            case A, B, C, D -> grade.name();
            case BEGINNER -> "초심";
            case NEWCOMER -> "왕초심";
            case INTRO -> "입문";
        };
    }

    static String genderLabel(Gender gender) {
        return switch (gender) {
            case MALE -> "남";
            case FEMALE -> "여";
        };
    }

    static LiveStatusGroupsResponse statusGroups(Map<ParticipantStatus, List<LiveParticipantResponse>> groups) {
        return new LiveStatusGroupsResponse(
                groups.getOrDefault(ParticipantStatus.RESTING, List.of()),
                groups.getOrDefault(ParticipantStatus.LESSON, List.of()),
                groups.getOrDefault(ParticipantStatus.NOT_ARRIVED, List.of()),
                groups.getOrDefault(ParticipantStatus.ABSENT, List.of())
        );
    }

    public static LiveParticipantResponse participant(SessionParticipant participant) {
        Instant checkedInAt = participant.getCheckedInAt();
        long waitMinutes = participant.getStatus() == ParticipantStatus.WAITING && checkedInAt != null
                ? Math.max(0, Duration.between(checkedInAt, Instant.now()).toMinutes())
                : 0;

        return new LiveParticipantResponse(
                participant.getId(),
                participant.getMember().getId(),
                participant.getMember().getName(),
                gradeLabel(participant.getGradeSnapshot()),
                participant.getStatus(),
                participant.getGameCount(),
                waitMinutes,
                participant.getMember().getAgeBand(),
                genderLabel(participant.getMember().getGender()),
                checkedInAt,
                participant.getLastMatchEndedAt()
        );
    }

    public static LiveParticipantResponse participantWithStatus(SessionParticipant participant, ParticipantStatus status) {
        LiveParticipantResponse response = participant(participant);
        return new LiveParticipantResponse(
                response.id(),
                response.memberId(),
                response.name(),
                response.grade(),
                status,
                response.games(),
                response.waitMinutes(),
                response.ageBand(),
                response.gender(),
                response.checkedInAt(),
                response.lastMatchEndedAt()
        );
    }
}
