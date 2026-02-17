# Incident Tracker Mini App

Mini incident management tool with a REST API backend and a dashboard frontend.  
It is based on the assignment requirements shown in the brief (incident management, server‑side search/sort/pagination, and status updates).

---

## 1. Tech Stack

- Backend: Node.js, Express, CORS
- Frontend: Vite, Vanilla JavaScript, CSS

Folder layout:

- `/backend` – REST API, data model, seeding logic
- `/frontend` – Vite app with dashboard UI

---

## 2. Running the App Locally

Clone the repository and then:

```bash
cd "project of unnati"
```

### 2.1 Start the backend API

```bash
cd backend
npm install        # first time only
npm start          # http://localhost:4000/api/incidents
```

### 2.2 Start the frontend UI

In a second terminal:

```bash
cd frontend
npm install        # first time only
npm run dev        # http://localhost:5173/
```

---

## 3. Data Model

Each incident has:

- `id`: number
- `title`: string
- `service`: string
- `severity`: `"SEV1" | "SEV2" | "SEV3" | "SEV4+"`
- `status`: `"OPEN" | "MITIGATED" | "RESOLVED"`
- `owner` (optional): string
- `summary` (optional): string
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

The backend seeds 200 random incidents in memory when it starts.

---

## 4. REST API Overview

Base URL: `http://localhost:4000/api`

### 4.1 List incidents (server‑side pagination + filters)

`GET /incidents`

Query parameters:

- `page` – page number (default `1`)
- `pageSize` – items per page (default `20`, max `100`)
- `search` – text search over `title`, `service`, `owner`, `summary`
- `severity` – filter by severity (`SEV1`, `SEV2`, `SEV3`, `SEV4+`)
- `status` – filter by status (`OPEN`, `MITIGATED`, `RESOLVED`)
- `sortBy` – one of `createdAt`, `updatedAt`, `severity`, `status`, `service`, `title`
- `sortDirection` – `asc` or `desc` (default `desc`)

Response shape:

```json
{
  "data": [/* incidents */],
  "page": 1,
  "pageSize": 20,
  "total": 200,
  "totalPages": 10
}
```

### 4.2 Get incident by id

`GET /incidents/:id`

Returns a single incident object or `404` if not found.

### 4.3 Create incident

`POST /incidents`

Body:

```json
{
  "title": "string (required, min 3 chars)",
  "service": "string (required, min 2 chars)",
  "severity": "SEV1|SEV2|SEV3|SEV4+",
  "status": "OPEN|MITIGATED|RESOLVED",
  "owner": "string (optional)",
  "summary": "string (optional)"
}
```

Validations:

- Missing/invalid fields return `400` with `{ "errors": [ "...", "..." ] }`.

### 4.4 Update incident (including status changes)

`PATCH /incidents/:id`

Body: any subset of the fields from **Create incident**.  
Used by the UI both for:

- Changing status in the table
- Editing an incident via the side form

---

## 5. Frontend Features (Dashboard)

The dashboard is a single page app built in `frontend/src/main.js` and `frontend/src/style.css`.

Main features:

- **Incident table**
  - Server‑side pagination (Next/Previous)
  - Server‑side search, severity filter, and status filter
  - Sort dropdown (`createdAt`, `updatedAt`, `severity`, `status`, `service`, `title`)
  - Inline status select for each row (calls `PATCH /incidents/:id`)
- **Debounced search**
  - Search input waits 400ms after typing before hitting the API.
- **Details panel**
  - Click a row to view full details (owner, timestamps, summary).
- **Create/Edit form**
  - Create new incident via `POST /incidents`
  - Edit selected incident via `PATCH /incidents/:id`
  - Basic client‑side validation (required title/service) plus server validation.

---

## 6. Design Decisions

- **Server‑side filtering and paging**  
  All search, filter, and sorting logic lives on the backend so the UI can scale to larger datasets without loading everything into the browser.

- **In‑memory store for incidents**  
  Keeps the assignment simple: no external database required, but the structure is ready to be swapped to a real DB/ORM layer.

- **Vanilla JS frontend**  
  Stays lightweight and framework‑agnostic while still showing a realistic dashboard UX.

---

## 7. Possible Future Improvements

- Persist incidents in a real database (PostgreSQL, MongoDB, etc.).
- Add authentication and role‑based access control.
- Add more incident fields (SLO/SLA, tags, incident type).
- Add tests for backend and small UI smoke tests.

