package com.playcock.match;

import com.playcock.live.LiveDtos;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class MatchController {
    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping("/sessions/{sessionId}/matches")
    LiveDtos.LiveMatchResponse create(@PathVariable Long sessionId, @Valid @RequestBody MatchDtos.CreateMatchRequest request) {
        return matchService.createWaitingMatch(sessionId, request.participantIds());
    }

    @DeleteMapping("/matches/{matchId}")
    void cancel(@PathVariable Long matchId) {
        matchService.cancelWaitingMatch(matchId);
    }

    @PostMapping("/matches/{matchId}/start")
    LiveDtos.LiveMatchResponse start(@PathVariable Long matchId, @Valid @RequestBody MatchDtos.StartMatchRequest request) {
        return matchService.startMatch(matchId, request.courtId());
    }

    @PostMapping("/matches/{matchId}/finish")
    LiveDtos.LiveMatchResponse finish(@PathVariable Long matchId) {
        return matchService.finishMatch(matchId);
    }
}
