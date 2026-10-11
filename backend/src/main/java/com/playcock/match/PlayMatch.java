package com.playcock.match;

import com.playcock.common.audit.BaseEntity;
import com.playcock.court.Court;
import com.playcock.session.PlaySession;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "play_match")
public class PlayMatch extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PlaySession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id")
    private Court court;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchStatus status = MatchStatus.READY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MatchType matchType = MatchType.OPEN_DOUBLES;

    private Instant startedAt;

    private Instant finishedAt;

    protected PlayMatch() {
    }

    public PlayMatch(PlaySession session, MatchType matchType) {
        this.session = session;
        this.matchType = matchType;
    }

    public PlaySession getSession() {
        return session;
    }

    public Court getCourt() {
        return court;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public MatchType getMatchType() {
        return matchType;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void start(Court court, Instant startedAt) {
        this.court = court;
        this.status = MatchStatus.PLAYING;
        this.startedAt = startedAt;
    }

    public void finish(Instant finishedAt) {
        this.status = MatchStatus.FINISHED;
        this.finishedAt = finishedAt;
    }

    public void cancel() {
        this.status = MatchStatus.CANCELLED;
    }
}
