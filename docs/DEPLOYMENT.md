# Deploy to Railway and Vercel

## 1. Database

Use MongoDB Atlas for the deployed backend. Localhost on Railway refers to the Railway container, not your PC. Create a database user with readWrite access to mini-project-manager and permit the backend's outbound network access in Atlas. Keep the connection string private. Existing local data does not migrate automatically.

## 2. Railway backend

Create a Railway project from the gitnarayan/mini_project GitHub repository. Keep the service root at the repository root, NOT /backend: the npm workspace lockfile is at the root. railway.json selects Dockerfile.backend, which installs only backend production dependencies and starts Express. The healthcheck is /api/health.

Set service variables:

```text
MONGODB_URI=<your Atlas URI with /mini-project-manager before the question mark>
JWT_SECRET=<a new random secret of at least 32 characters>
CLIENT_ORIGIN=https://<your-production-project>.vercel.app
NODE_ENV=production
```

Generate a JWT secret locally using `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Enter it directly in Railway Variables. Do not commit it. Railway supplies PORT; the server already uses it.

Generate a public domain under service networking. Record its HTTPS URL. /api/health must return {"status":"ok"}. The service only starts listening after MongoDB connects.

## 3. Vercel frontend

Import the same repository, select Next.js, and set Root Directory to frontend. Enable inclusion of source files outside the root directory if required for npm workspaces. Keep the standard Next.js build/output settings; do not select static export.

Set BACKEND_URL to the Railway HTTPS origin, without a trailing slash or /api. Example: https://your-backend.up.railway.app. It is a server-side setting, not NEXT_PUBLIC_BACKEND_URL. Deploy after setting this value because rewrites are configured at build time.

## 4. Match the origins

Set Railway CLIENT_ORIGIN to the exact final Vercel production origin, with https:// and no trailing slash or path, then redeploy Railway. A preview deployment has a different origin and is not automatically allowed. Use the production URL to test. Redeploy Vercel whenever BACKEND_URL changes.

The browser calls Vercel /api, which proxies to Railway. This preserves the existing HttpOnly session-cookie flow. Secure cookies are enabled by NODE_ENV=production. Do not switch the browser to direct cross-origin requests to Railway without redesigning cookie/CSRF settings.

## 5. Verify

On the Vercel URL: signup, logout, login, create a project, add/edit/delete tasks, filter/sort tasks, then refresh to verify persistence. Test a second account to confirm project isolation. /api/health on both domains should respond successfully. A 403 Untrusted request origin means CLIENT_ORIGIN does not exactly match the browser origin. A proxy connection error means BACKEND_URL or the Railway service is unavailable.

These files prepare deployment; they do not create hosted services or provide an Atlas database. Check each platform's account/plan requirements before provisioning.
