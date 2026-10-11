package com.playcock.member;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/members")
public class MemberController {
    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    MemberDtos.MemberResponse create(@Valid @RequestBody MemberDtos.MemberRequest request) {
        return MemberDtos.MemberResponse.from(memberService.create(request));
    }

    @GetMapping
    List<MemberDtos.MemberResponse> findAll() {
        return memberService.findAll().stream().map(MemberDtos.MemberResponse::from).toList();
    }

    @PatchMapping("/{id}")
    MemberDtos.MemberResponse update(@PathVariable Long id, @Valid @RequestBody MemberDtos.MemberRequest request) {
        return MemberDtos.MemberResponse.from(memberService.update(id, request));
    }
}
