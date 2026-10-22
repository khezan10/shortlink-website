# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | yes       |

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Use GitHub's private reporting: **Security → Report a vulnerability**, or email
the maintainer. Include what the issue is, the steps to reproduce it, and the
impact you believe it has. Expect a first response within 72 hours.

## What this project does and does not do with your data

- The service is **open by design**: a short link, a temporary inbox, a
  project list — none of them need an account.
- IP addresses are **hashed with a salt** before they are stored, never stored
  in the clear.
- Only the application data is stored, in MongoDB. Nothing is shared with a
  third party.
- Secrets are read from the environment. They are never committed —
  `.env.local` is in `.gitignore`, and a CI job fails the build if a
  credential reaches a commit.
