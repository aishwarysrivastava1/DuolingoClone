# Keeping the backend awake on Render

Render's free web services **spin down after 15 minutes without inbound traffic**, and the next
visitor waits up to about a minute for a cold start. (A spin-down also wipes the instance's disk;
learner progress is safe as long as the backend uses Turso — see the README's *Database: Turso*.)

Two independent pingers keep the service warm by calling a lightweight health endpoint:

| Layer | Interval | Purpose |
| --- | --- | --- |
| GitHub Actions — [`.github/workflows/keep-alive.yml`](../.github/workflows/keep-alive.yml) | every 10 min | Primary pinger |
| cron-job.org **or** UptimeRobot | every 5–10 min | Backup for when GitHub's scheduled runs are late or skipped |

Both call **`GET /health`**, which returns `200 {"status":"ok"}` immediately. It does not touch the
database, has no auth, and also answers `HEAD` (UptimeRobot's default method).

## 1. Find your health URL

After deploying the backend (see the README's *Deployment* section), your URL is:

```
https://<your-service>.onrender.com/health
```

Check it: `curl -i https://<your-service>.onrender.com/health` → `HTTP/1.1 200` and `{"status":"ok"}`.

## 2. GitHub Actions (primary)

1. In the GitHub repo: **Settings → Secrets and variables → Actions**.
2. Add **`BACKEND_HEALTH_URL`** with the URL above, either as a **secret** (masked in logs) or on the
   **Variables** tab (visible in logs). The workflow reads whichever is set.
3. Open **Actions → Keep backend awake → Run workflow** to test it now. The run summary should say
   `✅ Backend responded with HTTP 200`.

From then on it runs every 10 minutes. Each run retries twice with a 60 s timeout so a cold start
doesn't count as a failure; if the backend still doesn't answer, the run is marked failed (red) and
GitHub notifies you. Until the URL is set, runs skip the ping and show a warning instead of failing.

Good to know:
- Scheduled workflows only run from the **default branch** (`main`).
- GitHub can **delay or drop scheduled runs** when Actions is busy, especially around the top of the
  hour — that's what the backup below is for.
- In a public repo GitHub **disables scheduled workflows after 60 days without repository
  activity**. Re-enable it from the Actions tab if that happens.
- Actions minutes are free for public repos. In a private repo each run is billed as at least one
  minute (~4,300 minutes a month), which exceeds the free allowance.

## 3. Backup: an external monitor (pick one)

### Option A — cron-job.org

1. Create a free account at [cron-job.org](https://cron-job.org) and choose **Create cronjob**.
2. **URL:** your health URL. **Schedule:** every 10 minutes (every 5 is fine too).
3. Keep the request method as **GET** and turn on the failure notifications (failed run / recovered).
4. Save, then use the test run to confirm it gets HTTP 200.

cron-job.org uses a short request timeout (around 30 s). If a ping lands while the service is
asleep it may be logged as failed, but that request still wakes the service and the next one succeeds.

### Option B — UptimeRobot

1. Create a free account at [uptimerobot.com](https://uptimerobot.com) (free plan: 5-minute checks).
2. **New monitor → HTTP(s)**, paste your health URL, set the interval to **5 minutes**, and pick an
   email alert contact.
3. Save. UptimeRobot sends `HEAD` requests for HTTP monitors by default; `/health` supports them.
   You also get uptime history and down/up alerts.

One backup is enough; running both does no harm.

## 4. Verify

- In the Render dashboard → **Logs**, you should see `GET /health` (or `HEAD /health`) every few minutes.
- The service stays **Live** and the first page load no longer waits for a cold start.

## Limits to keep in mind

- **Instance hours:** each Render workspace gets **750 free instance hours per month**, and an
  always-on service uses about 720–744. Keep only **one** free service awake this way, or Render
  suspends all free services once the hours run out.
- **Data persistence:** keep-alive only avoids cold starts. Durable progress comes from storing data
  in Turso (`TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`); without it the local SQLite fallback is wiped
  on every spin-down, restart and deploy.
