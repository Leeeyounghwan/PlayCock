package com.playcock.history;

import com.playcock.session.SessionStatus;
import com.playcock.participant.ParticipantStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class HistoryDtos {
    private HistoryDtos() {
    }

    public record SessionHistorySummary(
            Long id,
            LocalDate sessionDate,
            String name,
            SessionStatus status,
            long matchCount,
            int participantCount,
            long absentCount,
            long notArrivedCount
    ) {
    }

    public record SessionHistoryStats(
            int totalParticipants,
            long playedParticipants,
            long totalMatches,
            long absentCount,
            long notArrivedCount,
            long noGameCount
    ) {
    }

    public record MatchPlayerSummary(
            Long id,
            String name,
            String grade,
            int games
    ) {
    }

    public record MatchHistoryRow(
            Long id,
            String courtName,
            Instant startedAt,
            Instant finishedAt,
            long durationSeconds,
            List<MatchPlayerSummary> teamA,
            List<MatchPlayerSummary> teamB
    ) {
    }

    public record MemberHistorySummary(
            Long participantId,
            Long memberId,
            String name,
            String grade,
            ParticipantStatus status,
            String attendanceLabel,
            int games,
            Instant checkedInAt,
            Instant lastMatchEndedAt
    ) {
    }

    public record CourtHistorySummary(
            String courtName,
            long matchCount,
            long totalDurationSeconds,
            List<MatchHistoryRow> matches
    ) {
    }

    public record SessionHistoryDetail(
            SessionHistorySummary session,
            SessionHistoryStats summary,
            List<MatchHistoryRow> matches,
            List<MemberHistorySummary> members,
            List<CourtHistorySummary> courtHistories
    ) {
    }
}
