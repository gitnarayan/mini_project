# Deploy the frontend and backend to Vercel

## 1. Database

Use MongoDB Atlas for the deployed backend. Localhost on Railway refers to the Railway container, not your PC. Create a database user with readWrite access to mini-project-manager and permit the backend's outbound network access in Atlas. Keep the connection string private. Existing local data does not migrate automatically.

## 2. Vercel backend

Create a second Vercel project from the same GitHub repository and set Root Directory to `backend`.
Set the Framework Preset to **Other**. The backend configuration is detected from
`backend/vercel.json`, and Vercel treats `backend/api/index.js` as a serverless Express
handler.

Set service variables:

```text
MONGODB_URI=<your Atlas URI with /mini-project-manager before the question mark>
JWT_SECRET=<a new random secret of at least 32 characters>
CLIENT_ORIGIN=https://<your-production-project>.vercel.app
NODE_ENV=production
```

Generate a JWT secret locally using `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Enter it directly in Vercel Environment Variables. Do not commit it.

Deploy the backend project and record its HTTPS domain. `/api/health` should return
`{"status":"ok"}`. The function connects to MongoDB on demand.

## 3. Vercel frontend

Import the same repository, select Next.js, and set Root Directory to `frontend`. Select
the Next.js Framework Preset and do not select static export. If Next.js cannot resolve
workspace dependencies, enable "Include source files outside Root Directory".

Set BACKEND_URL to the Vercel backend HTTPS origin, without a trailing slash or `/api`.
Example: `https://mini-project-api.vercel.app`. It is a server-side setting, not
`NEXT_PUBLIC_BACKEND_URL`. Deploy after setting this value because rewrites are
configured at build time.

## 4. Match the origins

Set the backend `CLIENT_ORIGIN` to the exact final frontend Vercel production
origin, with `https://` and no trailing slash or path, then redeploy the backend.
A preview deployment has a different origin and is not automatically allowed.
Redeploy the frontend whenever `BACKEND_URL` changes.

The browser calls the frontend's `/api`, which proxies to the backend project.
This preserves the existing same-site HttpOnly session-cookie flow. Secure cookies
are enabled by `NODE_ENV=production`.

## 5. Verify

On the Vercel URL: signup, logout, login, create a project, add/edit/delete tasks, filter/sort tasks, then refresh to verify persistence. Test a second account to confirm project isolation. /api/health on both domains should respond successfully. A 403 Untrusted request origin means CLIENT_ORIGIN does not exactly match the browser origin. A proxy connection error means BACKEND_URL or the Railway service is unavailable.

These files prepare deployment; they do not create hosted services or provide an Atlas database. Check each platform's account/plan requirements before provisioning.
