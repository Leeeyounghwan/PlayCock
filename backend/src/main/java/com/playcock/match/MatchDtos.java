package com.playcock.match;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class MatchDtos {
    private MatchDtos() {
    }

    public record CreateMatchRequest(@NotEmpty List<Long> participantIds) {
    }

    public record StartMatchRequest(@NotNull Long courtId) {
    }
}
