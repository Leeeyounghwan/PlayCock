package com.playcock.court;

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
public class CourtController {
    private final CourtService courtService;

    public CourtController(CourtService courtService) {
        this.courtService = courtService;
    }

    @PostMapping("/sessions/{sessionId}/courts")
    CourtDtos.CourtResponse create(@PathVariable Long sessionId, @Valid @RequestBody CourtDtos.CourtRequest request) {
        return CourtDtos.CourtResponse.from(courtService.create(sessionId, request));
    }

    @GetMapping("/sessions/{sessionId}/courts")
    List<CourtDtos.CourtResponse> findBySession(@PathVariable Long sessionId) {
        return courtService.findBySession(sessionId).stream().map(CourtDtos.CourtResponse::from).toList();
    }

    @PatchMapping("/courts/{courtId}")
    CourtDtos.CourtResponse update(@PathVariable Long courtId, @Valid @RequestBody CourtDtos.CourtRequest request) {
        return CourtDtos.CourtResponse.from(courtService.update(courtId, request));
    }

    @DeleteMapping("/courts/{courtId}")
    void delete(@PathVariable Long courtId) {
        courtService.delete(courtId);
    }
}
