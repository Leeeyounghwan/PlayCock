package com.playcock.member;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MemberService {
    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    @Transactional
    public Member create(MemberDtos.MemberRequest request) {
        return memberRepository.save(new Member(request.name(), request.grade(), request.gender(), request.ageBand()));
    }

    @Transactional(readOnly = true)
    public List<Member> findAll() {
        return memberRepository.findAllByOrderByNameAsc();
    }

    @Transactional
    public Member update(Long id, MemberDtos.MemberRequest request) {
        Member member = get(id);
        member.update(request.name(), request.grade(), request.gender(), request.ageBand(), request.active() == null || request.active());
        return member;
    }

    @Transactional(readOnly = true)
    public Member get(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
    }
}
