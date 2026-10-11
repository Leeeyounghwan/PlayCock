package com.playcock.participant;

import com.playcock.common.audit.BaseEntity;
import com.playcock.member.Grade;
import com.playcock.member.Member;
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
@Table(name = "session_participant")
public class SessionParticipant extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PlaySession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ParticipantStatus status = ParticipantStatus.NOT_ARRIVED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Grade gradeSnapshot;

    private Instant checkedInAt;

    @Column(nullable = false)
    private int gameCount;

    private Instant lastMatchEndedAt;

    protected SessionParticipant() {
    }

    public SessionParticipant(PlaySession session, Member member, Grade gradeSnapshot) {
        this.session = session;
        this.member = member;
        this.gradeSnapshot = gradeSnapshot;
    }

    public PlaySession getSession() {
        return session;
    }

    public Member getMember() {
        return member;
    }

    public ParticipantStatus getStatus() {
        return status;
    }

    public Grade getGradeSnapshot() {
        return gradeSnapshot;
    }

    public Instant getCheckedInAt() {
        return checkedInAt;
    }

    public int getGameCount() {
        return gameCount;
    }

    public Instant getLastMatchEndedAt() {
        return lastMatchEndedAt;
    }

    public void changeStatus(ParticipantStatus status) {
        this.status = status;
        if (status == ParticipantStatus.WAITING && checkedInAt == null) {
            checkedInAt = Instant.now();
        }
        if (status == ParticipantStatus.NOT_ARRIVED) {
            checkedInAt = null;
        }
    }

    public void updateSnapshot(Grade gradeSnapshot) {
        this.gradeSnapshot = gradeSnapshot;
    }

    public void completeMatch(Instant endedAt) {
        this.status = ParticipantStatus.WAITING;
        this.gameCount += 1;
        this.lastMatchEndedAt = endedAt;
        this.checkedInAt = endedAt;
    }
}
