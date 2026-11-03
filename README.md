# Forma — Mini Project Manager

A full-stack project management assignment built with **Next.js + React**, **Redux Toolkit / RTK Query**, **Node.js + Express**, **MongoDB / Mongoose**, and **JWT authentication**.

## Features

- Email/password signup, login and logout; hashed passwords; JWT in an HttpOnly cookie.
- Protected workspace and API routes; every project/task operation checks ownership.
- Create, read, edit and delete projects with titles and descriptions.
- Create, edit and delete tasks with title, description, status and required due date.
- Filter tasks by status and inclusive due-date range; sort by date or workflow status in either direction.
- Responsive interface, search, progress summaries, loading/empty/error states and deletion confirmation.

## Requirements

- Node.js 22 or newer and npm.
- MongoDB running locally, or a MongoDB Atlas connection string.

## Setup (both frontend and backend)

From the repository root:

```sh
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

PowerShell equivalents for the copy commands:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Edit `backend/.env` with your MongoDB URI and a strong random JWT secret. Generate a secret using:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Start MongoDB if using a local database, then run:

If MongoDB is not installed, this project provides a development-only launcher. In a separate terminal run `npm run db -w backend` from the root (or `npm run db` from `backend`) and keep it open. It uses a real MongoDB executable downloaded by the test dependency and persists data in `backend/.mongo-data/`. The first launch may require internet access. It listens only on localhost port 27017. Do not run it alongside another MongoDB instance on that port. Use an installed MongoDB service or Atlas for production.

```sh
npm run dev
```

Open **http://localhost:3000** and create an account. Express runs on **http://localhost:4000**. If PowerShell blocks npm.ps1, use `npm.cmd` in place of `npm`.

To run independently:

```sh
npm run dev -w backend
npm run dev -w frontend
```

No seeded accounts or fake project records are included. Your data persists in your configured MongoDB database.

## Environment

| File / variable | Purpose |
| --- | --- |
| backend/.env: MONGODB_URI | Local or Atlas database connection |
| backend/.env: JWT_SECRET | Random secret, minimum 32 characters |
| backend/.env: PORT | Express port, default 4000 |
| backend/.env: CLIENT_ORIGIN | Exact frontend origin, default http://localhost:3000 |
| backend/.env: NODE_ENV | Set to production for secure cookies |
| frontend/.env.local: BACKEND_URL | Server-side API destination, default http://127.0.0.1:4000 |

## API contract

See [docs/API.md](docs/API.md) for endpoints, inputs, authentication, filters and error behavior.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

API integration tests use a real isolated MongoDB process through mongodb-memory-server, not your configured database. The first run downloads a MongoDB binary and requires internet access. Tests cover authentication, validation, project/task CRUD, filtering/sorting, cross-user access, CSRF origin checks, expired/tampered tokens, and logout.

## Production

Deploy the frontend to a Node-compatible Next.js host and the Express backend to a Node.js host with connectivity to MongoDB Atlas. Configure the environment variables above before building. Use HTTPS and set `NODE_ENV=production` on the backend. Set `CLIENT_ORIGIN` to the exact public frontend origin and `BACKEND_URL` to the reachable backend URL. Browser requests stay same-origin through the Next.js `/api` rewrite. Run `npm run build`, then `npm run start -w frontend` and `npm run start -w backend` in their respective services.

Do not deploy this as static-only hosting. JWTs expire after eight hours; logout clears the browser cookie. Individual stolen tokens are not revoked before expiration. Production at scale should add session revocation, shared rate-limit storage and monitoring.

## Implementation notes

- Tasks are embedded in their owning project document. This makes project-plus-task deletion atomic and simplifies ownership for this small assignment. For very large task collections, use a separate indexed collection; MongoDB has a 16 MB document limit.
- Atomic MongoDB updates prevent concurrent task edits from replacing unrelated tasks.
- Due dates are validated calendar dates (`YYYY-MM-DD`), avoiding timezone shifts.
- Status sort follows `todo → in-progress → done`, rather than alphabetical order.
- The backend derives owner IDs exclusively from verified JWTs. Client-supplied ownership fields are rejected.
- All mutating requests must include an Origin matching CLIENT_ORIGIN. Browser requests do this automatically; API clients must set the header.
- Redux stores API caches, not passwords or tokens. Logout resets the cache. The Redux store is created per provider instance.
- Protected frontend content waits for `/auth/me`; backend authorization is the security boundary.
- Google Fonts enhance typography when available; system font fallbacks work offline.

## Submission

Commit the source and package-lock.json to a public GitHub repository. Do not commit `.env`, `node_modules`, build outputs or database files. Include the repository URL in your submission; a deployed URL is optional. This project does not automatically publish a repository or deploy services.
