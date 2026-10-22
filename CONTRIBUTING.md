# Contributing

Thanks for helping. The bar is simple: keep it working, keep it honest.

## Getting set up

```bash
git clone https://github.com/khezan10/shortlink-website.git
cd shortlink-website
npm install
cp .env.example .env.local    # optional — the service still runs without it
npm run dev
```

## Before you open a pull request

```bash
npm run check      # lint + typecheck + tests + production build
```

All of it has to pass. CI runs exactly this, on Node 20 and Node 22.

## Ground rules

1. **No secrets in the diff.** Environment files are ignored; the CI secret
   scan fails the build if one is committed.
2. **Keep the public surface open.** No accounts, no paywalls, no tracking.
3. **Add a test with the fix.** The suite has to stay green.
4. **The interface is English.** Every public-facing string.

## Commits

Plain and factual: `fix:`, `feat:`, `docs:`, `chore:`, `test:`. Describe the
change, not the process.
