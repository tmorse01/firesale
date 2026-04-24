# Railway GitHub Autodeploy Setup

This repo is ready to deploy to Railway as a shared JavaScript monorepo with two long-running services:

- `firesale-api`
- `firesale-web`

Each service now has its own Railway config file:

- `/apps/api/railway.toml`
- `/apps/web/railway.toml`

These files tell Railway which build and start commands to use and limit deploy triggers to the relevant paths in the monorepo.

## Important branch note

As of April 23, 2026, this repository is currently on `master` locally and the only tracked remote branch is `origin/master`.

If you want Railway to auto-deploy on pushes to `main`, make sure the GitHub repository actually has a `main` branch and set that branch as the deploy trigger in Railway.

## One-time setup in Railway

1. In Railway, create a new project from the GitHub repository `tmorse01/firesale`.
2. Create or keep two services in that project:
   - `firesale-api`
   - `firesale-web`
3. For both services, connect the same GitHub repository.
4. In each service's settings, set the trigger branch to `main`.
5. For the API service, set the config-as-code path to `/apps/api/railway.toml`.
6. For the web service, set the config-as-code path to `/apps/web/railway.toml`.
7. Leave the root directory as `/` for both services so workspace installs and shared package builds run from the monorepo root.

## Variables to set

### API service

Set these service variables:

- `FIRESALE_ADMIN_KEY`
- `FIRESALE_INTERNAL_TOKEN`
- `FIRESALE_ENABLE_BELLINGHAM_SCHEDULER=false`

Optional:

- `PORT` if you want to override Railway's injected port
- `DATABASE_URL` for the future Prisma/Postgres runtime

Recommended volume mount:

- Mount a Railway volume at `/app/apps/api/runtime`

That keeps `apps/api/runtime/store.json` persistent across restarts and deploys.

### Web service

Set:

- `VITE_API_BASE_URL=https://<your-api-domain>`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_GOOGLE_MAP_ID` if needed

If you use the default Railway domain for the API service, copy that public URL into `VITE_API_BASE_URL`.

## What auto-deploy will do

Once the repo is connected and the branch is set to `main`, Railway will automatically deploy new commits pushed to that branch for any linked service. Railway's current GitHub autodeploy docs say the trigger branch is configured in each service's settings.

## Optional cleanup before enabling `main`

If GitHub is still using `master`, rename the branch before turning on deploys to `main`:

```bash
git branch -m master main
git push -u origin main
```

Then update the default branch in GitHub and point Railway's trigger branch to `main`.
