package com.playcock.participant;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class ParticipantController {
    private final ParticipantService participantService;

    public ParticipantController(ParticipantService participantService) {
        this.participantService = participantService;
    }

    @PostMapping("/sessions/{sessionId}/participants/import")
    List<ParticipantDtos.ParticipantResponse> importMembers(
            @PathVariable Long sessionId,
            @Valid @RequestBody ParticipantDtos.ImportParticipantsRequest request
    ) {
        return participantService.importMembers(sessionId, request.memberIds()).stream()
                .map(ParticipantDtos.ParticipantResponse::from)
                .toList();
    }

    @GetMapping("/sessions/{sessionId}/participants")
    List<ParticipantDtos.ParticipantResponse> findBySession(@PathVariable Long sessionId) {
        return participantService.findBySession(sessionId).stream()
                .map(ParticipantDtos.ParticipantResponse::from)
                .toList();
    }

    @PatchMapping("/session-participants/{participantId}/status")
    ParticipantDtos.ParticipantResponse changeStatus(
            @PathVariable Long participantId,
            @Valid @RequestBody ParticipantDtos.ChangeStatusRequest request
    ) {
        return ParticipantDtos.ParticipantResponse.from(participantService.changeStatus(participantId, request.status()));
    }

    @PatchMapping("/session-participants/{participantId}")
    ParticipantDtos.ParticipantResponse update(
            @PathVariable Long participantId,
            @Valid @RequestBody ParticipantDtos.UpdateParticipantRequest request
    ) {
        return ParticipantDtos.ParticipantResponse.from(participantService.update(participantId, request));
    }

    @DeleteMapping("/session-participants/{participantId}")
    void delete(@PathVariable Long participantId) {
        participantService.delete(participantId);
    }
}
