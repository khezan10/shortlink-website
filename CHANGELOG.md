# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-10-22

The first stable release of the link shortener.

### Added

- **Short links** — a 7-character code, or your own alias of 3–32 characters.
- **One link per destination** — a unique index on `url` rejects duplicates and
  returns the short link that already exists (`409 DUPLICATE_URL`).
- **Dead-link cleanup** — every destination is probed when a link is created
  and re-checked in the background; after `DEAD_LINK_STRIKES` consecutive
  failures the link is deleted.
- **Idle-link purging** — a link nobody clicks for `INACTIVE_PURGE_DAYS`
  (default 7) is removed by the daily cron.
- **Two valid domains** — `shortUrl` is derived from the request host, so the
  same code works on the custom domain and on the `*.vercel.app` deployment.
- **Rate limiting** — per IP, with a TTL collection and
  `CREATE_LIMIT_PER_HOUR` to configure it.
- **An SSRF guard** — private and loopback hosts, and self-referential URLs,
  are rejected before anything is fetched.
- **An honest health endpoint** — `GET /api/health` returns `{ ok: true }` or
  a classified failure reason.
- **A scripted E2E run** against the production deployment.
- **A self-healing deploy** — a GitHub Action redeploys when the last Vercel
  build failed.
- **Tests** — unit tests for the code generator, the URL validator, the link
  checker and the rate limiter.
- **CI** — lint, typecheck, tests and a production build on Node 20 and 22.
- **A secret scan** that fails the build if a credential reaches a commit.
- **Dependabot** — weekly minor and patch updates.

### Changed

- The ESLint setup no longer uses `eslint-config-next`. That package pulls in
  `fast-glob → micromatch → braces`, and the current `braces` advisory
  (`<= 3.0.3`, no patched release yet) made `npm audit` report five high
  severity issues for what is only a lint-time glob parser. The plugins are
  now used directly, and `npm audit` reports **0 vulnerabilities**.
- The CI runs on Node 20 and Node 22 instead of Node 22 only, and the build
  step is part of the pipeline.

### Fixed

- The `npm ci` step refused a lock file written on Windows (the optional
  `@emnapi` packages are missing), so the workflow installs instead.
- The loader animation could stay invisible when the tab was not focused.
- The database status is now shown, with a friendly `503` while the connection
  is still coming up.

[1.0.0]: https://github.com/khezan10/shortlink-website/releases/tag/v1.0.0
