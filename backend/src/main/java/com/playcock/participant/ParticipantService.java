package com.playcock.participant;

import com.playcock.member.Member;
import com.playcock.member.MemberService;
import com.playcock.match.MatchPlayerRepository;
import com.playcock.session.PlaySession;
import com.playcock.session.SessionService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ParticipantService {
    private final SessionParticipantRepository participantRepository;
    private final MatchPlayerRepository matchPlayerRepository;
    private final SessionService sessionService;
    private final MemberService memberService;

    public ParticipantService(
            SessionParticipantRepository participantRepository,
            MatchPlayerRepository matchPlayerRepository,
            SessionService sessionService,
            MemberService memberService
    ) {
        this.participantRepository = participantRepository;
        this.matchPlayerRepository = matchPlayerRepository;
        this.sessionService = sessionService;
        this.memberService = memberService;
    }

    @Transactional
    public List<SessionParticipant> importMembers(Long sessionId, List<Long> memberIds) {
        PlaySession session = sessionService.get(sessionId);
        return memberIds.stream()
                .map(memberId -> participantRepository.findBySessionIdAndMemberId(sessionId, memberId)
                        .orElseGet(() -> {
                            Member member = memberService.get(memberId);
                            return participantRepository.save(new SessionParticipant(session, member, member.getGrade()));
                        }))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SessionParticipant> findBySession(Long sessionId) {
        return participantRepository.findAllBySessionIdOrderByIdAsc(sessionId);
    }

    @Transactional
    public SessionParticipant changeStatus(Long participantId, ParticipantStatus status) {
        SessionParticipant participant = get(participantId);
        participant.changeStatus(status);
        return participant;
    }

    @Transactional
    public SessionParticipant update(Long participantId, ParticipantDtos.UpdateParticipantRequest request) {
        SessionParticipant participant = get(participantId);
        Member member = participant.getMember();

        member.update(request.name(), request.grade(), request.gender(), request.ageBand(), member.isActive());
        participant.updateSnapshot(request.grade());
        participant.changeStatus(request.status());

        return participant;
    }

    @Transactional
    public void delete(Long participantId) {
        SessionParticipant participant = get(participantId);
        if (participant.getGameCount() > 0 || participant.getStatus() == ParticipantStatus.MATCH_READY || participant.getStatus() == ParticipantStatus.PLAYING
                || matchPlayerRepository.existsBySessionParticipantId(participantId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Participant with match history cannot be deleted");
        }
        participantRepository.delete(participant);
    }

    @Transactional(readOnly = true)
    public SessionParticipant get(Long participantId) {
        return participantRepository.findWithMemberById(participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));
    }
}
