package com.playcock.court;

import com.playcock.common.audit.BaseEntity;
import com.playcock.session.PlaySession;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "court")
public class Court extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PlaySession session;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false)
    private int sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourtStatus status = CourtStatus.OPEN;

    protected Court() {
    }

    public Court(PlaySession session, String name, int sortOrder) {
        this.session = session;
        this.name = name;
        this.sortOrder = sortOrder;
    }

    public PlaySession getSession() {
        return session;
    }

    public String getName() {
        return name;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public CourtStatus getStatus() {
        return status;
    }

    public void update(String name, int sortOrder, CourtStatus status) {
        this.name = name;
        this.sortOrder = sortOrder;
        this.status = status;
    }

    public void markInUse() {
        this.status = CourtStatus.IN_USE;
    }

    public void markOpen() {
        this.status = CourtStatus.OPEN;
    }
}
