package com.playcock.match;

import com.playcock.common.audit.BaseEntity;
import com.playcock.member.Grade;
import com.playcock.participant.SessionParticipant;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "match_player")
public class MatchPlayer extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    private PlayMatch match;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_participant_id", nullable = false)
    private SessionParticipant sessionParticipant;

    @Column(nullable = false)
    private int teamNo;

    @Column(nullable = false)
    private int slotNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Grade gradeSnapshot;

    protected MatchPlayer() {
    }

    public MatchPlayer(PlayMatch match, SessionParticipant sessionParticipant, int teamNo, int slotNo, Grade gradeSnapshot) {
        this.match = match;
        this.sessionParticipant = sessionParticipant;
        this.teamNo = teamNo;
        this.slotNo = slotNo;
        this.gradeSnapshot = gradeSnapshot;
    }

    public PlayMatch getMatch() {
        return match;
    }

    public SessionParticipant getSessionParticipant() {
        return sessionParticipant;
    }

    public int getTeamNo() {
        return teamNo;
    }

    public int getSlotNo() {
        return slotNo;
    }

    public Grade getGradeSnapshot() {
        return gradeSnapshot;
    }
}
