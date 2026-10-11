package com.playcock.court;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class CourtDtos {
    private CourtDtos() {
    }

    public record CourtRequest(@NotBlank String name, int sortOrder, @NotNull CourtStatus status) {
    }

    public record CourtResponse(Long id, String name, int sortOrder, CourtStatus status) {
        static CourtResponse from(Court court) {
            return new CourtResponse(court.getId(), court.getName(), court.getSortOrder(), court.getStatus());
        }
    }
}
