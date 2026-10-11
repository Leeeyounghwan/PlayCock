package com.playcock.live;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/live/sessions")
public class LiveController {
    private final LiveService liveService;

    public LiveController(LiveService liveService) {
        this.liveService = liveService;
    }

    @GetMapping("/{sessionId}/snapshot")
    LiveDtos.LiveSnapshotResponse snapshot(@PathVariable Long sessionId) {
        return liveService.snapshot(sessionId);
    }

    @GetMapping("/{sessionId}/queue-board")
    LiveDtos.QueueBoardResponse queueBoard(@PathVariable Long sessionId) {
        return liveService.queueBoard(sessionId);
    }
}
