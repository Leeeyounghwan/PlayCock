package com.playcock.finance;

import com.playcock.common.audit.BaseEntity;
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
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "finance_entry")
public class FinanceEntry extends BaseEntity {
    @Column(nullable = false)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FinanceEntryType type;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private PlaySession session;

    @Column(length = 200)
    private String memo;

    @Column(nullable = false)
    private boolean kakaoVerified;

    protected FinanceEntry() {
    }
}
