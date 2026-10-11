package com.playcock.history;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/history")
public class HistoryController {
    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping("/sessions")
    List<HistoryDtos.SessionHistorySummary> sessions() {
        return historyService.sessions();
    }

    @GetMapping("/sessions/{sessionId}")
    HistoryDtos.SessionHistoryDetail detail(@PathVariable Long sessionId) {
        return historyService.detail(sessionId);
    }
}
