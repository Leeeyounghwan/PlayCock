package com.playcock.session;

import com.playcock.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "play_session")
public class PlaySession extends BaseEntity {
    @Column(nullable = false)
    private LocalDate sessionDate;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status = SessionStatus.PLANNED;

    private Instant startedAt;

    private Instant endedAt;

    protected PlaySession() {
    }

    public PlaySession(LocalDate sessionDate, String name) {
        this.sessionDate = sessionDate;
        this.name = name;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public String getName() {
        return name;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void open() {
        this.status = SessionStatus.OPEN;
        this.startedAt = Instant.now();
    }

    public void close() {
        this.status = SessionStatus.CLOSED;
        this.endedAt = Instant.now();
    }
}
