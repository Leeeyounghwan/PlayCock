package com.playcock.session;

import com.playcock.invite.InviteCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public final class SessionDtos {
    private SessionDtos() {
    }

    public record SessionRequest(@NotNull LocalDate sessionDate, @NotBlank String name) {
    }

    public record SessionResponse(Long id, LocalDate sessionDate, String name, SessionStatus status, String inviteCode) {
        static SessionResponse from(PlaySession session, InviteCode inviteCode) {
            return new SessionResponse(session.getId(), session.getSessionDate(), session.getName(), session.getStatus(), inviteCode == null ? null : inviteCode.getCode());
        }
    }
}
