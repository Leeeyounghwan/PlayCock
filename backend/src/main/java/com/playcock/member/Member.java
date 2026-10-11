package com.playcock.member;

import com.playcock.common.audit.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "member")
public class Member extends BaseEntity {
    @Column(nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Grade grade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Gender gender;

    @Column(length = 20)
    private String ageBand;

    @Column(nullable = false)
    private boolean active = true;

    protected Member() {
    }

    public Member(String name, Grade grade, Gender gender, String ageBand) {
        this.name = name;
        this.grade = grade;
        this.gender = gender;
        this.ageBand = ageBand;
    }

    public String getName() {
        return name;
    }

    public Grade getGrade() {
        return grade;
    }

    public Gender getGender() {
        return gender;
    }

    public String getAgeBand() {
        return ageBand;
    }

    public boolean isActive() {
        return active;
    }

    public void update(String name, Grade grade, Gender gender, String ageBand, boolean active) {
        this.name = name;
        this.grade = grade;
        this.gender = gender;
        this.ageBand = ageBand;
        this.active = active;
    }
}
