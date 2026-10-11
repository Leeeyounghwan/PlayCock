# Matching Algorithm

Phase 5 starts with a rule + score recommendation, not automatic match confirmation.

Current frontend prototype:

- Candidate pool: waiting participants.
- Lower game count wins priority.
- Longer wait time wins priority.
- Recently played participants get a penalty.
- The selected four are sorted by grade strength.
- Team balancing uses strongest + weakest vs middle + middle.

This keeps the first version predictable and inspectable. Backend service extraction comes when the API-backed live board replaces mock data.
