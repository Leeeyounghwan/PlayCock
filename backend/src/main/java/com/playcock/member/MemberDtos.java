package com.playcock.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class MemberDtos {
    private MemberDtos() {
    }

    public record MemberRequest(
            @NotBlank String name,
            @NotNull Grade grade,
            @NotNull Gender gender,
            String ageBand,
            Boolean active
    ) {
    }

    public record MemberResponse(
            Long id,
            String name,
            Grade grade,
            Gender gender,
            String ageBand,
            boolean active
    ) {
        static MemberResponse from(Member member) {
            return new MemberResponse(member.getId(), member.getName(), member.getGrade(), member.getGender(), member.getAgeBand(), member.isActive());
        }
    }
}
