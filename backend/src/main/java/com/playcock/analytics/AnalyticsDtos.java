package com.playcock.analytics;

import java.time.LocalDate;
import java.util.List;

public final class AnalyticsDtos {
    private AnalyticsDtos() {
    }

    public record MonthlyAnalyticsResponse(
            String month,
            MonthlySummary summary,
            List<MemberMonthlyStat> memberStats,
            List<SessionMonthlyStat> sessionStats,
            List<PairMonthlyStat> partnerPairs
    ) {
    }

    public record MonthlySummary(
            long sessionCount,
            long participantCount,
            long playedParticipantCount,
            long matchCount,
            long absentCount,
            long notArrivedCount,
            long noGameCount
    ) {
    }

    public record MemberMonthlyStat(
            Long memberId,
            String name,
            String grade,
            long sessionCount,
            long gameCount,
            long absentCount,
            long notArrivedCount,
            long noGameCount,
            LocalDate lastSessionDate
    ) {
    }

    public record SessionMonthlyStat(
            Long sessionId,
            LocalDate sessionDate,
            String name,
            long participantCount,
            long playedParticipantCount,
            long matchCount,
            long absentCount,
            long notArrivedCount,
            long noGameCount
    ) {
    }

    public record PairMonthlyStat(
            String label,
            long count
    ) {
    }
}
