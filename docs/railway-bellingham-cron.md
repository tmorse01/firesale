# Railway Bellingham Cron

This project can run the Bellingham deal scraper on Railway with two services:

- `firesale-api`: the always-on API that owns the persisted JSON store
- `firesale-bellingham-cron`: a scheduled job that calls the API's protected internal ingest endpoint

## Why this shape

The current runtime store is persisted in `apps/api/runtime/store.json`. That file must stay attached to the API service's mounted volume. A separate cron container should not write its own copy of that file.

Because of that, the cron job should trigger:

- `POST /api/internal/ingest/bellingham`

and let the API service perform the actual ingest and write.

## API service setup

Railway service:

- Service name: `firesale-api`
- Build command: `npm run build`
- Start command: `npm start`

Environment variables:

- `FIRESALE_SERVICE_TARGET=api`
- `FIRESALE_INTERNAL_TOKEN=<long-random-secret>`
- `FIRESALE_ENABLE_BELLINGHAM_SCHEDULER=false`

Attach a Railway volume at:

- `/app/apps/api/runtime`

That keeps `apps/api/runtime/store.json` alive across deploys and restarts.

## Cron service setup

Railway service:

- Service name: `firesale-bellingham-cron`
- Build command: `npm run build`
- Start command: `npm start`

Environment variables:

- `FIRESALE_SERVICE_TARGET=cron-bellingham`
- `FIRESALE_API_URL=https://your-api-domain.up.railway.app`
- `FIRESALE_INTERNAL_TOKEN=<same-secret-as-api>`
- `FIRESALE_MINIMUM_DEALS=3`
- `FIRESALE_FAIL_BELOW_MINIMUM=true`

The cron service uses:

- `npm run cron:bellingham`

which calls `scripts/trigger-bellingham-ingest.mjs` and hits the internal API endpoint in `publish` mode by default.

## One-time production run

You can trigger the ingest manually once the API is live:

```bash
curl -X POST "https://your-api-domain.up.railway.app/api/internal/ingest/bellingham" \
  -H "content-type: application/json" \
  -H "x-firesale-internal-token: your-secret" \
  -d "{\"mode\":\"publish\",\"minimumDeals\":3}"
```

## Daily schedule

In Railway, add a cron schedule to the `firesale-bellingham-cron` service.

Recommended starting cadence:

- `0 15 * * *`

Railway cron schedules run in UTC. For Bellingham:

- `15:00 UTC` is `8:00 AM` during Pacific daylight time
- `16:00 UTC` is `8:00 AM` during Pacific standard time

If you want a stable local morning run year-round, update the UTC hour when daylight saving time changes.

## Useful overrides

The cron script supports a few overrides:

```bash
npm run cron:bellingham -- --dry-run
npm run cron:bellingham -- --minimum-deals=5
npm run cron:bellingham -- --allow-below-minimum
npm run cron:bellingham -- --endpoint=/api/internal/ingest/bellingham
```

## Important guardrails

- Do not enable `FIRESALE_ENABLE_BELLINGHAM_SCHEDULER` in production if Railway cron is also enabled.
- Keep the API and cron services on the same `FIRESALE_INTERNAL_TOKEN`.
- If the cron run finishes below the minimum deal target, the script exits non-zero by default so Railway marks the job as failed.
- Once storage moves from JSON to Postgres, the cron service can be simplified to run the ingest script directly instead of calling the API.
