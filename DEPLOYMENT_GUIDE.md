# UniJobLink — Deploy to Aiven + Render + Vercel (Free Tier)

Your code is live at **https://github.com/SaltyyyMiguu/UniJobWeb-**. This guide walks through the three services in the order you need them: database first (Render needs its connection string), then backend (Vercel needs its URL), then frontend last.

---

## Part 1 — Aiven (Free MySQL Database)

1. Go to **aiven.io** and sign up / log in (GitHub login works).
2. Click **Create service** (or the **+** button on your services dashboard).
3. Select **MySQL** as the service type.
4. Choose the **Free** plan tier (labeled "Free" or "Hobbyist" depending on region availability — pick whichever free option is offered).
5. Pick a **cloud provider and region** — any is fine; pick one geographically close to where Render will run (Render's free tier defaults to Oregon, US, so a US region keeps latency lowest, though it's not critical for a small project).
6. Give the service a name (e.g., `unijoblink-db`) and click **Create service**.
7. Wait for the service status to turn green ("Running") — this can take 1–3 minutes.
8. Open the service, go to the **Overview** tab. You'll see a **Service URI** field containing a full `mysql://` connection string — it bundles the username, an auto-generated password, host, port, and default database name, with `?ssl-mode=REQUIRED` on the end.
9. Click the copy icon to copy the full Service URI. **This is your `DATABASE_URL`** — save it somewhere safe (a password manager, not a chat window or committed file), you'll paste it into Render in Part 2.
10. By default Aiven's free MySQL comes with a database named `defaultdb` — that's fine, no need to create a new one. The app's `sequelize.sync({ alter: true })` (already in `server.js`) will auto-create all the tables the first time the backend connects.

**Note:** Aiven's free trial services are typically time-limited (commonly ~1 month) or auto-suspend after inactivity, depending on their current plan terms — check the service's expiry/suspend notice in the Aiven dashboard so your database doesn't unexpectedly disappear later.

---

## Part 2 — Render (Free Node.js Backend)

1. Go to **render.com** and sign up / log in with **GitHub** (this makes connecting your repo one click).
2. Click **New +** (top right) → **Web Service**.
3. Under "Connect a repository," find and select **SaltyyyMiguu/UniJobWeb-**. If it's not listed, click **Configure account** and grant Render access to that repo.
4. Fill in the service settings:
   - **Name**: `unijoblink-backend` (or anything you like — this becomes part of your URL: `https://unijoblink-backend.onrender.com`)
   - **Region**: any (Oregon is the default and fine)
   - **Branch**: `main`
   - **Root Directory**: `backend` — **important**, since this is a monorepo with both `backend/` and `frontend/` folders. Without this, Render will try to build from the repo root and fail.
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
5. Scroll to **Environment Variables** and add each of these (click **Add Environment Variable** for each row):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | *paste the Aiven Service URI from Part 1* |
   | `JWT_SECRET` | any long random string (e.g., generate one at randomkeygen.com, or run `openssl rand -hex 32` locally) |
   | `FRONTEND_URL` | leave blank for now — you'll come back and set this after Part 3 gives you the Vercel URL |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | your sending Gmail address (the one you set up an App Password for) |
   | `SMTP_PASS` | that Gmail App Password (16 characters, no spaces) |

   Do **not** set `PORT` — Render sets this automatically, and `server.js` already reads it via `process.env.PORT`.

6. Click **Create Web Service**. Render will pull your repo, run `npm install`, then `node server.js`. Watch the **Logs** tab — look for `Server running on port ...` and `Database connection established.` to confirm it connected to Aiven successfully.
7. Once it's live, copy the URL shown at the top of the service page — something like `https://unijoblink-backend.onrender.com`. **This is your backend URL**, needed for Part 3.

**Free tier note:** Render's free web services spin down after ~15 minutes of no traffic and take ~30–60 seconds to wake back up on the next request — the first load after idle time will feel slow. That's expected, not a bug.

---

## Part 3 — Vercel (Free Vite Frontend)

1. Go to **vercel.com** and sign up / log in with **GitHub**.
2. Click **Add New...** → **Project**.
3. Find **SaltyyyMiguu/UniJobWeb-** in the list and click **Import**.
4. Vercel will try to auto-detect the framework. Since this is a monorepo, before deploying:
   - Under **Root Directory**, click **Edit** and select `frontend`.
   - Once you set the root directory, Vercel should auto-detect **Vite** as the framework preset (shown in the "Framework Preset" dropdown) — confirm it says Vite; if not, select it manually.
   - Build command should auto-fill to `npm run build` (or `vite build`) and output directory to `dist` — leave these as detected.
5. Expand **Environment Variables** and add:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | the Render backend URL from Part 2, e.g. `https://unijoblink-backend.onrender.com` (no trailing slash, no `/api`) |

6. Click **Deploy**. Wait ~1–2 minutes for the build to finish.
7. Once deployed, copy your live frontend URL — something like `https://uni-job-web.vercel.app`.

---

## Part 4 — Close the loop: tell the backend about the frontend

CORS on the backend only allows requests from an origin it knows about. Now that you have the real Vercel URL:

1. Go back to **Render** → your `unijoblink-backend` service → **Environment**.
2. Edit the `FRONTEND_URL` variable you left blank earlier and set it to your Vercel URL (e.g., `https://uni-job-web.vercel.app`, no trailing slash).
3. Save — Render will automatically redeploy the service with the new value.

---

## Verification checklist

1. Open your Vercel URL in a browser.
2. Try registering a new account (Student/Company/Supervisor) — this exercises frontend → Render → Aiven end-to-end, plus a real OTP email send.
3. If registration fails, check in this order:
   - **Vercel build logs** — did the frontend build succeed?
   - **Render logs** — did the backend start and connect to Aiven? Look for CORS errors here too (a rejected-origin error means `FRONTEND_URL` in Part 4 doesn't exactly match your Vercel URL).
   - **Browser console/network tab** — a failed `fetch`/`XHR` to the wrong URL usually means `VITE_API_URL` wasn't picked up (Vercel env vars require a redeploy to take effect if added after the first deploy).
4. Log in as the account you just created, confirm the dashboard loads (this confirms JWT auth end-to-end).

---

## Two things worth hardening later (not blockers)

- **`rejectUnauthorized: false`** in `backend/config/database.js` encrypts the Aiven connection but skips certificate verification. It's the standard quick-start pattern for this stack and fine for a student project, but if you want it fully hardened later: Aiven's dashboard has a **CA Certificate** download under the service's connection info — you'd load that file and set `ca: fs.readFileSync(...)` with `rejectUnauthorized: true`.
- **Root `.gitignore`** now excludes `.claude/`, `.playwright-mcp/`, root-level debug screenshots, and the two academic `.pptx`/`.docx` files (one had a student ID in its filename) — none of that was ever pushed. Worth a final skim of what *did* get pushed (`PROJECT_CHANGELOG.txt`, `BUG_REPORT.md`, etc. are still in there) in case you'd rather trim any of that before sharing the repo link publicly.
