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

## History

```text
GET /api/admin/history/sessions
GET /api/admin/history/sessions/{sessionId}
```

`sessions`는 종료된 세션(`CLOSED`)만 내려준다.

세션 요약 응답에는 아래 항목이 포함된다.

- 세션 기본 정보
- 완료 경기 수
- 참가자 수
- 불참 수
- 미참석 수

세션 상세 응답에는 아래 항목이 포함된다.

- `summary`: 참가자, 경기 참여, 완료 경기, 불참/미참석/경기 없음 집계
- `members`: 참가자별 상태, 출석 라벨, 경기 수, 체크인/마지막 경기 시간
- `matches`: 완료 경기 목록
- `courtHistories`: 코트별 완료 경기 수와 총 사용 시간

지각 판정은 아직 세션 예정 시작 시간이 없어 History 응답에 포함하지 않는다.
