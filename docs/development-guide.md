# Development Guide

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
./gradlew bootRun
```

Local embedded DB mode:

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

The `local` profile uses H2 file storage under `backend/.local-data/` and loads development seed data from `db/dev-migration`.

Backend checks:

```bash
cd backend
./gradlew test
```

The backend targets Java 21. The project includes a Gradle Wrapper, so a local Gradle installation is not required.

Useful Phase 2 smoke flow after backend boot:

```bash
curl -X POST http://localhost:8080/api/admin/members -H "Content-Type: application/json" -d "{\"name\":\"김민수\",\"grade\":\"B\",\"gender\":\"MALE\",\"ageBand\":\"30대\"}"
curl -X POST http://localhost:8080/api/admin/sessions -H "Content-Type: application/json" -d "{\"sessionDate\":\"2026-09-22\",\"name\":\"화요모임\"}"
```
