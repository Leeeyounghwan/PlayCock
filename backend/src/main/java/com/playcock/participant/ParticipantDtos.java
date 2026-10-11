package com.playcock.participant;

import com.playcock.member.Grade;
import com.playcock.member.Gender;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

public final class ParticipantDtos {
    private ParticipantDtos() {
    }

    public record ImportParticipantsRequest(@NotEmpty List<Long> memberIds) {
    }

    public record ChangeStatusRequest(@NotNull ParticipantStatus status) {
    }

    public record UpdateParticipantRequest(
            @NotNull ParticipantStatus status,
            @NotNull String name,
            @NotNull Grade grade,
            @NotNull Gender gender,
            String ageBand
    ) {
    }

    public record ParticipantResponse(
            Long id,
            Long memberId,
            String name,
            Grade gradeSnapshot,
            ParticipantStatus status,
            Instant checkedInAt,
            int gameCount
    ) {
        static ParticipantResponse from(SessionParticipant participant) {
            return new ParticipantResponse(
                    participant.getId(),
                    participant.getMember().getId(),
                    participant.getMember().getName(),
                    participant.getGradeSnapshot(),
                    participant.getStatus(),
                    participant.getCheckedInAt(),
                    participant.getGameCount()
            );
        }
    }
}
