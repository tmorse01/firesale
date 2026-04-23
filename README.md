# FireSale

FireSale is a real-time, location-based community deal network built as a React PWA with an Express API.

## What is implemented

- Mobile-first React + Vite frontend
- Express API with seeded in-memory demo data
- Hot, New, and Nearby deal feeds
- Deal detail pages with voting, comments, related deals, and manual expiry
- Deal creation flow
- Google Maps integration hooks for map view and Places Autocomplete
- PWA manifest and lightweight offline shell caching
- Prisma schema for the intended PostgreSQL production model

## Project structure

- `apps/web`: React PWA frontend
- `apps/api`: Express API and Prisma schema
- `packages/shared`: shared schemas and types

## Local setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Add environment variables:

- Copy `apps/web/.env.example` to `apps/web/.env`
- Copy `apps/api/.env.example` to `apps/api/.env`

3. Start the API:

```bash
npm run dev:api
```

4. Start the web app in a second terminal:

```bash
npm run dev:web
```

## Google Maps setup

Add your Google key to `apps/web/.env`:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_GOOGLE_MAP_ID=optional_custom_map_id
```

Enable these APIs in Google Cloud:

- Maps JavaScript API
- Places API
- Geocoding API

## Notes

- The API currently runs in a seeded demo mode so the full product loop works immediately.
- The Prisma schema is included for the production PostgreSQL data model, but there is not yet a live Prisma adapter wired into the API runtime.
- Nearby ranking uses feed distance when location is available. Hot ranking uses the score formula from the spec.
