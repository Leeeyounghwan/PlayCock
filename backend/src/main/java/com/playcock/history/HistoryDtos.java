package com.playcock.history;

import com.playcock.session.SessionStatus;
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
            long matchCount
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
            int games,
            Instant lastMatchEndedAt
    ) {
    }

    public record SessionHistoryDetail(
            SessionHistorySummary session,
            List<MatchHistoryRow> matches,
            List<MemberHistorySummary> members
    ) {
    }
}
