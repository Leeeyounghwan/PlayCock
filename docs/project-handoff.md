# PlayCock Project Handoff

이 문서는 신규 개발자가 PlayCock 프로젝트에 합류했을 때 현재 구조, 설계 의도, 구현 상태, 다음 개발 순서를 빠르게 파악하기 위한 정리본이다. README로 옮길 수 있는 내용을 포함하지만, 현재 목적은 개발 인수인계와 Phase별 작업 기준을 맞추는 데 있다.

## 프로젝트 목표

PlayCock은 배드민턴 모임의 당일 경기 운영과 장기 운영 데이터를 함께 관리하는 웹 애플리케이션이다.

- 운영진은 PC/태블릿에서 Live Dashboard로 참가자 상태, 대기열, 대기 매치, 코트, 경기 시작/종료를 관리한다.
- 참가자는 모바일 Viewer 화면에서 현재 코트, 대기 매치, 대기열, 상태별 인원을 조회한다.
- Session 종료 후에는 참석, 경기, 코트 사용 기록을 운동 이력과 월간 통계의 근거 데이터로 남긴다.
- 운영비와 벌금은 카카오 모임통장의 보조 이력 장부로 관리한다.

## 기술 스택

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query는 의존성에 포함되어 있으나 Live Dashboard API 연동에는 아직 본격 적용 전이다.
- INSPINIA React 템플릿은 참고 자료로 보관되어 있으며, 현재 화면은 필요한 Shell/Card/Button/Modal 스타일만 PlayCock 도메인에 맞춰 직접 구성한 상태다.

### Backend

- Spring Boot 3.3
- Java 21
- Spring Data JPA
- Flyway
- PostgreSQL 운영 전환을 목표로 한 스키마
- Local 개발용 H2 내장 DB 프로필

## 로컬 DB 전략

현재 운영용 PostgreSQL을 바로 연결하기 어려운 상태이므로, Phase 1에서 `local` 프로필의 H2 파일 DB를 추가했다.

- 기본 프로필은 기존처럼 PostgreSQL 설정을 유지한다.
- `local` 프로필은 H2 파일 DB를 사용한다.
- H2 데이터 파일은 `backend/.local-data/` 아래 생성되며 Git 추적 대상에서 제외한다.
- 개발 seed 데이터는 `backend/src/main/resources/db/dev-migration/`에 분리되어 있고, `local` 프로필에서만 Flyway가 읽는다.
- 운영 배포 시에는 `application.yml`의 PostgreSQL 환경변수 설정을 사용하면 된다.

로컬 백엔드 실행 예시:

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

H2 콘솔:

```text
http://localhost:8080/h2-console
JDBC URL: jdbc:h2:file:./.local-data/playcock;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
User: sa
Password: empty
```

Gradle Wrapper가 포함되어 있으므로 별도 Gradle 설치는 필요 없다. Java 21은 필요하다.

## 현재 디렉터리 구조

```text
backend/
  src/main/java/com/playcock/
    common/audit/
    court/
    finance/
    invite/
    live/
    match/
    member/
    participant/
    session/
  src/main/resources/
    application.yml
    application-local.yml
    db/migration/
    db/dev-migration/

frontend/
  src/
    app/
    components/
      common/
      playcock/
    features/
      admin/
      live/
    layouts/
    styles/
    types/

docs/
  api.md
  architecture.md
  database.md
  development-guide.md
  implementation-plan.md
  matching-algorithm.md
  project-handoff.md

reference/
  README.md
```

## 백엔드 구현 상태

현재 백엔드는 기초 도메인과 일부 CRUD/API가 구현되어 있다.

구현된 주요 도메인:

- `member`
- `play_session`
- `invite_code`
- `session_participant`
- `court`
- `play_match`
- `match_player`
- `finance_entry`
- `fine_record`

구현된 API:

- `POST /api/admin/sessions`
- `GET /api/admin/sessions`
- `GET /api/admin/sessions/{sessionId}`
- `POST /api/admin/sessions/{sessionId}/open`
- `POST /api/admin/sessions/{sessionId}/close`
- `POST /api/admin/members`
- `GET /api/admin/members`
- `PATCH /api/admin/members/{memberId}`
- `POST /api/admin/sessions/{sessionId}/participants/import`
- `GET /api/admin/sessions/{sessionId}/participants`
- `PATCH /api/admin/session-participants/{participantId}/status`
- `PATCH /api/admin/session-participants/{participantId}`
- `POST /api/admin/sessions/{sessionId}/courts`
- `GET /api/admin/sessions/{sessionId}/courts`
- `PATCH /api/admin/courts/{courtId}`
- `DELETE /api/admin/courts/{courtId}`
- `POST /api/view/access`
- `GET /api/live/sessions/{sessionId}/snapshot`
- `GET /api/live/sessions/{sessionId}/queue-board`

아직 없는 핵심 API:

- 수동 매치 생성
- 랜덤 매칭 preview
- 관계선 preview
- 대기 매치 코트 배정
- 경기 시작
- 경기 종료
- 경기 취소

## 프론트 구현 상태

현재 프론트는 화면과 로컬 상호작용 중심으로 구성되어 있다.

주요 화면:

- `/admin/live`: Live Dashboard
- `/admin/sessions`: 세션 관리 목업
- `/admin/history`: 운동 이력 목업
- `/admin/analytics`: 월간 통계 목업
- `/admin/finance`: 운영비 관리 목업
- `/live/:sessionId?`: Viewer 목업

Live Dashboard는 현재 프로젝트 버전의 화면 레이아웃을 기준으로 유지한다. Phase 1에서는 화면 배치를 바꾸지 않고, 데이터 진입점만 `LiveSnapshot` 형태로 정리했다.
Phase 2에서는 해당 데이터 진입점을 백엔드 Live 조회 API와 연결했다. 서버 연결이 가능하면 `/api/live/sessions/{sessionId}/snapshot` 응답을 사용하고, 서버 연결이 안 되면 기존 샘플 데이터를 유지한다.

관련 파일:

- `frontend/src/features/live/AdminShellPage.tsx`
- `frontend/src/features/live/liveTypes.ts`
- `frontend/src/features/live/liveMock.ts`
- `frontend/src/features/live/matching.ts`
- `frontend/src/components/playcock/CourtCard.tsx`

## Phase 1 완료 범위

Phase 1의 목적은 실제 DB/API 연동을 바로 하기 전에 개발 환경과 Live Dashboard 데이터 구조를 정리하는 것이다.

완료된 내용:

- H2 내장 DB 의존성 추가
- `application-local.yml` 추가
- local 프로필에서만 읽는 개발 seed migration 추가
- H2 데이터 파일 Git 제외
- Gradle Wrapper 추가
- Live Dashboard 로컬 데이터를 `LiveSnapshot` 생성 함수로 분리
- Live Dashboard에서 쓰는 Session, Court, Match, Participant, StatusGroup 타입 정리
- 기존 화면 동작을 유지하면서 이후 API 응답으로 교체하기 쉬운 구조 마련

## Phase 2 완료 범위

Phase 2의 목적은 Live Dashboard의 초기 조회와 대기열 새로고침을 실제 백엔드 API와 연결하는 것이다.

완료된 내용:

- `GET /api/live/sessions/{id}/snapshot`
- `GET /api/live/sessions/{id}/queue-board`
- 프론트 API 클라이언트 추가
- Admin Live Dashboard가 백엔드 데이터를 조회하도록 연결
- 새로고침 버튼을 실제 queue-board 재조회로 변경
- Vite 개발 서버 `/api` 프록시를 백엔드 `http://127.0.0.1:8080`으로 연결

검증된 내용:

- Frontend TypeScript build
- Frontend Vite production build
- Backend Gradle compile/test task
- Local H2 프로필 Spring Boot 기동
- `GET /api/live/sessions/1/snapshot` 응답 확인
- `GET /api/live/sessions/1/queue-board` 응답 확인

## Phase 3 완료 범위

Phase 3의 목적은 Live Dashboard의 참가자 모달에서 변경한 참가자 상태와 기본 정보가 백엔드 DB에 저장되도록 연결하는 것이다.

완료된 내용:

- 미입장 -> 대기 체크인
- 대기 <-> 휴식
- 대기 <-> 레슨
- 대기/미입장 -> 불참
- 참가자 정보 모달 저장
- 상태 변경 후 refetch
- `PATCH /api/admin/session-participants/{participantId}` 추가
- 참가자 이름, 급수, 성별, 연령대 저장
- `member` 기본 정보와 `session_participant.grade_snapshot` 동시 갱신
- `WAITING` 전환 시 `checkedInAt` 기록
- `NOT_ARRIVED` 전환 시 현재 체크인 시간 초기화
- 프론트 참가자 모달의 `적용` 버튼을 API 저장 후 Live Snapshot 재조회 방식으로 변경

검증된 내용:

- Frontend TypeScript build
- Frontend Vite production build
- Backend Gradle compile/test task
- Local H2 프로필 Spring Boot 기동
- API로 대기 참가자를 휴식으로 이동 후 queue-board 반영 확인
- API로 휴식 참가자를 대기열로 원복 후 queue-board 반영 확인
- 브라우저에서 참가자 모달 저장 후 대기열 10명 -> 9명, 휴식 그룹 표시 확인
- 브라우저에서 휴식 참가자를 대기열로 원복 후 대기열 10명 확인

## 남은 Phase

### Phase 4: 코트 관리 저장과 일시중지

- 코트 추가/수정/삭제 API 연결
- 코트 일시중지 처리
- 일시중지 코트 배정 제외
- 진행 중 코트 삭제/중지 방어

### Phase 5: 매치 lifecycle 저장

- 수동 매치 생성
- 대기 매치 저장
- 코트 배정
- 경기 시작
- 경기 종료
- 경기 취소
- `play_match`, `match_player` 저장
- 참가자 상태와 경기 수 갱신

### Phase 6: 관계선 중복 경기 계산

- 선택된 4명의 6개 pair 계산
- Session 내 대기/진행/완료 경기 기준 중복 횟수 계산
- 취소 경기 제외
- 0회 관계도 표시
- 3회 이상 warning 처리

### Phase 7: 랜덤 매칭 고도화

- 남복/여복/혼복/자유복식 조건
- 경기 수, 대기 시간, 연속 경기, 최근 파트너/상대, 중복 조합 패널티
- 가능한 3개 팀 조합 비교
- 추천안 승인 후 대기 매치 생성

### Phase 8: Viewer와 Admin 데이터 공유

- Viewer가 Live Snapshot API 사용
- 초대코드 접근 후 Viewer Live Board 이동
- Viewer 10초 polling
- 수동 새로고침은 queue-board 부분 조회
- Viewer는 조회 전용으로 유지

### Phase 9: History/Analytics 연계

- Session 종료 시 확정 데이터 처리
- 종료된 Match만 통계 대상
- 취소 Match 제외
- 참석 기준 정리
- History/Analytics 구현을 위한 조회 기준 확정

## 개발 시 주의사항

- 화면 레이아웃은 현재 프로젝트 버전을 기준으로 한다.
- 설계서는 기능 기준으로 참고하되, 기존 화면 배치는 사용자의 지속 수정 결과로 본다.
- Viewer와 Admin은 최종적으로 같은 Live Snapshot 데이터를 사용해야 한다.
- Admin만 상태 변경, 매치 생성, 코트 제어 액션을 갖는다.
- 운영 DB는 PostgreSQL을 목표로 하므로 H2 전용 SQL이나 H2 전용 JPA 동작에 의존하지 않는다.
- Flyway migration은 운영용 공통 migration과 local seed migration을 분리한다.
- Live Dashboard의 다음 작업은 Phase 2부터 실제 API 응답 연결을 기준으로 진행한다.
