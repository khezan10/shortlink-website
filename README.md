# MZG Shortlink

A small, self-hosted link shortener with a terminal-flavoured UI, duplicate protection, dead-link cleanup, and automatic purge of unused links.

Live: **[link.mzg.my.id](https://link.mzg.my.id)** · mirror: [shortlink-website-psi.vercel.app](https://shortlink-website-psi.vercel.app)

[![CI](https://github.com/khezan10/shortlink-website/actions/workflows/ci.yml/badge.svg)](https://github.com/khezan10/shortlink-website/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/khezan10/shortlink-website.svg)](https://github.com/khezan10/shortlink-website/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-b4ff2b.svg)](LICENSE)

---

## Features

- **Short links** — `POST /api/links` returns a 7-character code, or use your own alias (3–32 chars).
- **One link per destination** — a unique index on `url` rejects duplicates and returns the short link that already exists (`409 DUPLICATE_URL`).
- **Dead-link cleanup** — every destination is probed on create and re-checked in the background. After `DEAD_LINK_STRIKES` consecutive failures the link is deleted.
- **7-day retention for idle links** — a link nobody clicks for `INACTIVE_PURGE_DAYS` (default 7) is removed by the daily cron.
- **Two valid domains** — `shortUrl` is derived from the request host, so the same code works on the custom domain and on the `*.vercel.app` deployment.
- **Rate limiting** — per-IP with a TTL collection (`CREATE_LIMIT_PER_HOUR`).
- **SSRF guard** — private/loopback hosts and self-referential URLs are rejected.
- **Honest health endpoint** — `GET /api/health` returns `{ ok: true }` or a classified failure reason.
- **English UI** — terminal theme, keyboard-friendly form, live list of the latest links.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS v4 + a small terminal design system |
| Database | MongoDB Atlas (`links`, `rate_limits`) |
| Hosting | Vercel + Vercel Cron |
| Tests | Vitest (unit) + a scripted E2E run against production |

## How it works

```
browser ──POST /api/links──▶ validate → SSRF guard → reachability check ──▶ MongoDB
                                                                 │
                          unique index { url: 1 } ◀──────────────┘ (duplicate ⇒ 409)

browser ──GET /{code}──▶ MongoDB lookup ──▶ 302 redirect
                            │
                            └─ after(): click counter + lazy dead-link check

Vercel Cron (03:00) ──▶ /api/cron/check-links
                          ├─ purge links without clicks for 7 days
                          └─ re-check stale destinations, delete after 2 failures
```

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/links` | Create a short link. Body: `{ "url": "https://…", "alias": "optional" }` |
| `GET` | `/api/links?limit=50` | Latest links (1–200), newest first |
| `GET` | `/{code}` | Redirect (302) and record the click |
| `GET` | `/api/health` | `{ ok, reason? }` |
| `GET` | `/api/cron/check-links` | Cron only, requires `Authorization: Bearer $CRON_SECRET` |

### Responses

| Status | `error` | Meaning |
|---|---|---|
| `201` | — | `{ code, shortUrl, url }` |
| `409` | `DUPLICATE_URL` | Destination already shortened; includes the existing `shortUrl` |
| `409` | `ALIAS_TAKEN` | Alias already used |
| `422` | `TARGET_UNREACHABLE` | Destination could not be reached |
| `429` | `RATE_LIMITED` | Per-IP creation limit hit |
| `503` | `DB_UNAVAILABLE` / `CHECK_INCONCLUSIVE` | Transient failure, retry later |

```bash
curl -X POST https://link.mzg.my.id/api/links \
  -H 'content-type: application/json' \
  -d '{"url":"https://example.com/a/very/long/page"}'
# → {"code":"F3j5gwO","shortUrl":"https://link.mzg.my.id/F3j5gwO","url":"https://example.com/a/very/long/page"}
```

## Environment variables

| Name | Required | Default | Notes |
|---|---|---|---|
| `MONGODB_URI` | yes | — | Atlas connection string (URL-encode the password) |
| `MONGODB_DB` | no | `shortlink` | Database name |
| `NEXT_PUBLIC_BASE_URL` | no | `https://mzg.my.id` | Fallback base URL when the request host is unavailable |
| `CRON_SECRET` | yes | — | Bearer token for the cron endpoint |
| `IP_HASH_SALT` | yes | — | Salt for hashing IPs before storing rate-limit keys |
| `DEAD_LINK_STRIKES` | no | `2` | Failures before a link is deleted |
| `MIN_RECHECK_HOURS` | no | `6` | Minimum age before a destination is re-checked |
| `INACTIVE_PURGE_DAYS` | no | `7` | Days without a click before a link is purged |
| `CREATE_LIMIT_PER_HOUR` | no | `10` | Links one IP may create per hour |

Copy `.env.example` to `.env.local` for local development. Never commit real credentials.

## Deploy your own

1. **MongoDB Atlas** — create a free cluster and a database user, then allow your host (`0.0.0.0/0` for Vercel's shared IPs).
2. **Import the repo** into Vercel and set the variables above (`CRON_SECRET` and `IP_HASH_SALT` can be any long random strings).
3. **Deploy.** On first request the app creates its indexes: `code` (unique), `url` (unique), `lastCheckedAt`, `lastClickedAt`, and the `rate_limits` TTL index.
4. **Cron** is declared in `vercel.json` and calls `/api/cron/check-links` daily at 03:00 UTC.
5. **Custom domain** — add it in Vercel, point DNS at Vercel, and optionally set `NEXT_PUBLIC_BASE_URL` to it.

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve the production build
npm test         # Vitest unit tests
npx tsc --noEmit # type check
```

## Notes

- The `url` unique index is created on first use. If legacy duplicates exist, the index falls back to a non-unique one so the app keeps working; clean the duplicates, then restart to regain enforcement.
- Rate-limit documents expire through a Mongo TTL index, so the collection stays small.
- The health endpoint never leaks the connection string or driver messages — only a classified reason.

## Checks

```bash
npm run check      # lint + typecheck + unit tests + production build
```

`npm run lint`, `npm run typecheck` and `npm test` also run on their own. CI
runs exactly the same command on Node 20 and Node 22.

The E2E run against production is a separate, manual step:

```bash
npm run e2e
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Report a vulnerability privately — see [SECURITY.md](SECURITY.md).


## License

MIT
