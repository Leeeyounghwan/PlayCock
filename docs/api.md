# PlayCock API

현재 구현된 API 목록이다.

## Admin

```text
POST /api/admin/sessions
GET  /api/admin/sessions
GET  /api/admin/sessions/{sessionId}
POST /api/admin/sessions/{sessionId}/open
POST /api/admin/sessions/{sessionId}/close

POST  /api/admin/members
GET   /api/admin/members
PATCH /api/admin/members/{memberId}

POST /api/admin/sessions/{sessionId}/participants/import
GET  /api/admin/sessions/{sessionId}/participants
PATCH /api/admin/session-participants/{participantId}/status
PATCH /api/admin/session-participants/{participantId}

POST   /api/admin/sessions/{sessionId}/courts
GET    /api/admin/sessions/{sessionId}/courts
PATCH  /api/admin/courts/{courtId}
DELETE /api/admin/courts/{courtId}
```

## Viewer access

```text
POST /api/view/access
```

## Live board

```text
GET /api/live/sessions/{sessionId}/snapshot
GET /api/live/sessions/{sessionId}/queue-board
```

`snapshot`은 Live Dashboard 초기 진입에 필요한 세션, 대기열, 코트, 대기 매치, 상태 그룹 데이터를 한 번에 내려준다.

`queue-board`는 수동 새로고침이나 polling에서 대기열과 상태 그룹만 가볍게 다시 조회하기 위한 엔드포인트다.

## Participant update

`PATCH /api/admin/session-participants/{participantId}`는 Live Dashboard의 참가자 정보 모달 저장용 엔드포인트다.

요청 예시:

```json
{
  "status": "WAITING",
  "name": "김민수",
  "grade": "B",
  "gender": "MALE",
  "ageBand": "30대"
}
```

저장 대상:

- `member.name`
- `member.grade`
- `member.gender`
- `member.ageBand`
- `session_participant.status`
- `session_participant.grade_snapshot`
- `session_participant.checked_in_at`

`WAITING`으로 전환하면 체크인 시간이 없을 때 현재 시각을 기록한다. `NOT_ARRIVED`로 전환하면 현재 세션의 체크인 시간을 초기화한다.
