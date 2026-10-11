# PlayCock Implementation Plan

## 1. PDF / design requirements

The attached PDF is treated as reference material, but its extracted text is garbled in this environment. The Markdown design document is the reliable source for the same requirements and matches the pasted request structure.

Core requirements:

- PlayCock is one service with two compositions over the same live session data.
- Viewer is mobile-first and read-only.
- Admin is PC/tablet-first and adds operations on top of shared live board components.
- Session is the main aggregate for daily operation.
- `member` and `session_participant` must be separate for long-term history.
- Only `WAITING` participants are match candidates.
- Viewer refresh uses TanStack Query polling first, not SSE/WebSocket.
- Manual match creation must show six relationship lines between the selected four players.
- Random matching starts as rule + score logic, not AI.
- Finance is a reference ledger. Kakao meeting bankbook remains the source of truth.

## 2. Mockup roles

- `PlayCock_Viewer_Mobile(2).png`: mobile Viewer live board. This sets the priority layout: active courts, waiting matches, queue, then status lanes.
- `PlayCock_Admin_Tablet(2).png`: Admin live board for tablet. Same domain data as Viewer, but with actions for participants, random matching, match creation, court assignment, and status changes.
- `PlayCock_Match_Create_Relationship_Lines(2).png`: manual match modal. This is the UI contract for selected player cards and the six pair relationship counts.
- `PlayCock_Admin_History.png`: Admin exercise history. Session history, member detail summary, and recent records.
- `PlayCock_Admin_Analytics.png`: monthly analytics. Month selector, KPI cards, daily completed match chart, attendance ranking, and game-count ranking.
- `PlayCock_Admin_Finance.png`: finance/fine ledger. It must visually warn that balances are reference-only.

## 3. INSPINIA structure

Current template root:

```text
INSPINIA_React/
  Admin/
    TS/
    JS/
  StarterKit/
    TS/
    JS/
  Docs/
```

Use `StarterKit/TS` as the base reference. It has the same Vite + React + TypeScript setup with much less demo code than `Admin/TS`.

Important files:

```text
StarterKit/TS/package.json
StarterKit/TS/src/layouts/MainLayout.tsx
StarterKit/TS/src/layouts/VerticalLayout.tsx
StarterKit/TS/src/layouts/components/Sidenav/
StarterKit/TS/src/layouts/components/TopBar/
StarterKit/TS/src/layouts/components/data.ts
StarterKit/TS/src/assets/scss/app.scss
StarterKit/TS/src/assets/scss/components/
StarterKit/TS/src/components/table/DataTable.tsx
StarterKit/TS/src/components/cards/ComponentCard.tsx
```

## 4. Template components to reuse

Reuse selectively:

- Vite / React / TypeScript config from StarterKit.
- SCSS variable/theme structure.
- Sidebar and topbar layout CSS, but replace menu data and remove demo dropdowns/customizer.
- Bootstrap card, table, form, button, badge, modal, dropdown styles.
- `Icon` wrapper if keeping Iconify.
- `DataTable` only for admin history/finance tables where sorting is useful.

Do not reuse wholesale:

- Demo pages.
- Dashboard sample routes.
- Customizer.
- Large Admin demo dependencies like calendars, maps, editors, file uploaders, PDF viewer.

## 5. Frontend directory structure

```text
frontend/
  src/
    app/
      router.tsx
      providers.tsx
    api/
      http.ts
      live.ts
      admin.ts
    layouts/
      AdminLayout.tsx
      ViewerLayout.tsx
    components/
      common/
        AppButton.tsx
        AppCard.tsx
        StatusBadge.tsx
        EmptyState.tsx
        ConfirmModal.tsx
      playcock/
        CourtCard.tsx
        WaitingMatchCard.tsx
        ParticipantCard.tsx
        ParticipantRow.tsx
        StatusLane.tsx
        GameCountBadge.tsx
    features/
      live/
      match/
      member/
      session/
      history/
      analytics/
      finance/
    styles/
      app.scss
      playcock.scss
    types/
      domain.ts
```

Keep shared domain UI under `components/playcock`. Put API-bound pages and mutations under `features`.

## 6. Backend package structure

```text
backend/src/main/java/com/playcock/
  PlayCockApplication.java
  common/
    audit/
    error/
    security/
  member/
  session/
  participant/
  court/
  match/
  live/
  history/
  analytics/
  finance/
```

Each feature package uses the simple Spring shape:

```text
controller
service
repository
domain/entity
dto
```

Skip CQRS, event sourcing, and MSA.

## 7. DB entity draft

Core:

- `member`: name, grade, gender, birth_year/age_band, active flag.
- `play_session`: date, name, status, invite_code_id, started_at, ended_at.
- `session_participant`: session, member, status, grade_snapshot, checked_in_at, game_count, last_match_ended_at.
- `court`: session, name, sort_order, status.
- `match`: session, court nullable, status, match_type, started_at, finished_at.
- `match_player`: match, session_participant, team_no, slot_no, grade_snapshot.
- `invite_code`: session, code, expires_at, active.

History / audit:

- `participant_status_history`
- `audit_log`

Finance:

- `finance_entry`: entry_date, type, category, amount, member nullable, session nullable, memo, kakao_verified.
- `fine_record`: member, reason, amount, occurred_on, status, paid_on nullable, finance_entry nullable.

Use enums for statuses. Add optimistic locking with `@Version` on entities changed during match start/finish.

## 8. API endpoint draft

Viewer:

```text
POST /api/view/access
GET  /api/live/sessions/{sessionId}/snapshot
GET  /api/live/sessions/{sessionId}/queue-board
```

Admin session / participants:

```text
POST  /api/admin/sessions
GET   /api/admin/sessions/{sessionId}
POST  /api/admin/sessions/{sessionId}/participants/import
PATCH /api/admin/session-participants/{participantId}/status
```

Courts / matches:

```text
POST /api/admin/sessions/{sessionId}/courts
POST /api/admin/sessions/{sessionId}/matches/manual
POST /api/admin/sessions/{sessionId}/matches/random-preview
POST /api/admin/sessions/{sessionId}/matches/relation-preview
POST /api/admin/matches/{matchId}/assign-court
POST /api/admin/matches/{matchId}/start
POST /api/admin/matches/{matchId}/finish
POST /api/admin/matches/{matchId}/cancel
```

Long-term admin:

```text
GET /api/admin/history/sessions?from=&to=
GET /api/admin/history/members/{memberId}
GET /api/admin/analytics/monthly?month=YYYY-MM
GET /api/admin/finance/summary?month=YYYY-MM
GET /api/admin/finance/entries
POST /api/admin/finance/entries
GET /api/admin/finance/fines
POST /api/admin/finance/fines
PATCH /api/admin/finance/fines/{fineId}
```

## 9. Implementation phases

### Phase 1 - Shell and domain base

- Create `frontend`, `backend`, `docs`, `reference`.
- Copy only StarterKit TS essentials into `frontend`.
- Add PlayCock theme tokens: navy, white card, lime accent.
- Create Spring Boot project and PostgreSQL config.
- Add base entities and migrations.

### Phase 2 - Session / member / participant / court

- Member CRUD.
- Session CRUD.
- Participant pre-registration as `NOT_ARRIVED`.
- Status transitions.
- Court CRUD.
- Invite code access.

### Phase 3 - Live board

- Viewer mobile page.
- Admin tablet/desktop page.
- Shared Court/Match/Queue/Status components.
- Snapshot and queue-board queries.
- 10-second polling and manual queue refresh.

### Phase 4 - Manual match and court operation

- Manual match modal.
- Relationship-line SVG overlay.
- Match creation.
- Court assignment.
- Start/finish/cancel transactions.

### Phase 5 - Random matching

- Rule + score preview service.
- Grade balance, game count, wait time, recent game, duplicate partner/opponent penalties.
- Admin approval before creation.

### Phase 6 - History and analytics

- Session history.
- Member exercise history.
- Monthly KPIs and ranking.
- Tie handling in service layer.

### Phase 7 - Finance and fines

- Finance ledger.
- Fine records.
- Paid fine to finance entry connection.
- Kakao verification marker.

## Current Frontend Phase Status

- Phase 3: Admin/Viewer navigation and live-board click interactions are implemented with mock data.
- Phase 4: Manual match creation starts with four empty slots. Waiting participants can be added from below, removed from the selected slots, and relationship counts appear only between selected players.
- Phase 5: Random recommendation uses a small rule + score helper and balances teams as strongest + weakest vs middle + middle.
- Phase 6: History and monthly analytics pages are available as mock admin views.
- Phase 7: Finance and unpaid fine pages are available as mock admin views. Kakao bankbook remains the source of truth.

## 10. Ambiguities / collisions

- Status naming differs: pasted request uses `RESTING`, MD uses `REST`; pick `RESTING` in backend enum and display it as `휴식`.
- MD includes `MATCH_READY`, pasted request omits it. Keep it, because it prevents already selected waiting-match participants from being matched again.
- PDF text extraction is garbled here. Use the Markdown/PDF visual design pair as the practical source of truth.
- Admin template has many dependencies. Use StarterKit and avoid importing Admin demo dependencies until a screen truly needs one.
- Design says do not reduce requirements, while final request says planning only. Current deliverable is planning only; implementation starts after review.
- Finance summary can show reference balance, but every screen must label it as non-official.
- Relationship count definition defaults to total same-match count. Partner/opponent split can be added behind the number popover later.
- Authentication depth is not specified. Start with simple Admin auth boundary; add roles only when multiple admin roles are needed.

## Lazy calls

- Skipped new dependencies in the plan unless already in StarterKit/Admin or explicitly required.
- Skipped monthly aggregate tables until query performance proves they are needed.
- Skipped SSE/WebSocket for MVP; 10-second polling is explicitly requested and cheaper to operate.
