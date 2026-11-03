# REST API contract

Base URL: `http://localhost:4000/api`. The frontend proxies `/api` to Express.
Requests and responses use JSON except successful deletion/logout (204, no body).
All write requests require `Origin: http://localhost:3000` (or configured CLIENT_ORIGIN).
Signup/login set a `session` HttpOnly JWT cookie, valid for eight hours. Send that cookie with protected requests.

## Endpoints

| Method | Path | Input / output |
| --- | --- | --- |
| GET | /health | `{ "status": "ok" }` (process health) |
| POST | /auth/signup | Required email + password; 201 `{id,email}` and cookie |
| POST | /auth/login | Required email + password; 200 `{id,email}` and cookie |
| POST | /auth/logout | Clears cookie; 204 |
| GET | /auth/me | Authenticated `{id,email}` |
| GET | /projects | Owned project array: `_id,title,description,taskCount,doneCount` |
| POST | /projects | Required title, optional description; 201 project |
| GET | /projects/:projectId | Owned project, including embedded tasks |
| PATCH | /projects/:projectId | Partial title/description; updated project |
| DELETE | /projects/:projectId | Delete owned project and all its tasks; 204 |
| GET | /projects/:projectId/tasks | Filtered/sorted task array |
| POST | /projects/:projectId/tasks | Required title/dueDate, optional description/status; 201 task |
| PATCH | /projects/:projectId/tasks/:taskId | Partial task fields; updated task |
| DELETE | /projects/:projectId/tasks/:taskId | Delete task; 204 |

All project/task endpoints require authentication. Foreign projects return 404, concealing existence. Task IDs are always scoped to the requested owned project.

## Validation and examples

Email: valid address, maximum 254 characters, normalized to lowercase.
Password: 8–72 characters, at most 72 UTF-8 bytes; hashed with bcrypt (12 rounds).
Title: trimmed nonempty string, at most 120 characters.
Description: optional string, at most 2000 characters, default empty.
Status: `todo` (default), `in-progress`, or `done`.
Due date: required valid `YYYY-MM-DD` calendar date. Past dates are allowed.
Unknown body fields are rejected. PATCH accepts a subset of the editable fields.

Create task body:

```json
{"title":"Design homepage","description":"Prepare the first draft","status":"todo","dueDate":"2026-11-15"}
```

Task responses add `_id`, `createdAt`, and `updatedAt` to these fields.

Task listing query parameters:

| Name | Values / meaning |
| --- | --- |
| status | todo, in-progress, done; omitted = all |
| sortBy | dueDate (default), status |
| order | asc (default), desc |
| dueFrom | Inclusive minimum YYYY-MM-DD |
| dueTo | Inclusive maximum YYYY-MM-DD |

Example: `/projects/PROJECT_ID/tasks?status=todo&sortBy=dueDate&order=asc&dueFrom=2026-11-01`.
Status order is todo, in-progress, done. Results are unpaginated for this mini project.

## Errors

Errors have `{ "message": "Human-readable explanation" }`.

| Status | Meaning |
| --- | --- |
| 400 | Invalid body, query, date or identifier |
| 401 | Invalid credentials or missing/expired/invalid JWT |
| 403 | Missing or untrusted Origin on a write request |
| 404 | Missing resource, foreign-owned resource or unknown endpoint |
| 409 | Email already registered |
| 429 | More than 50 signup/login attempts per IP in 15 minutes |
| 500 | Unexpected server failure; internal details not exposed |

Example validation error: `{ "message": "title: Too small: expected string to have >=1 characters" }`.
