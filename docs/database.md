# Database

PostgreSQL is the target database. Phase 1 schema lives in:

```text
backend/src/main/resources/db/migration/V1__initial_schema.sql
```

Core tables:

- `member`
- `play_session`
- `session_participant`
- `court`
- `play_match`
- `match_player`
- `invite_code`
- `finance_entry`
- `fine_record`

All tables include `version`, `created_at`, `updated_at`, `created_by`, and `updated_by`.
