# Support

Linux App Platform is an early-stage project maintained by two people in their spare time.
There is no commercial support, no SLA, and no chat channel. Everything happens in the
GitHub repository.

## Before asking

Most questions are answered by:

- [`README.md`](README.md) — what the project is and what actually works today.
- [`docs/development.md`](docs/development.md) — setup, commands, environment variables,
  troubleshooting.
- [`docs/architecture.md`](docs/architecture.md) — how the layers fit together.
- [`docs/catalog.md`](docs/catalog.md) — the application catalog and its rules.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to make a change.
- Existing [issues](https://github.com/AbhiDevepl/linux-app-platform/issues), including
  closed ones.

## Where to go

| What you have | Where it goes |
| ------------- | ------------- |
| Something is broken or behaves wrong | [Bug report](https://github.com/AbhiDevepl/linux-app-platform/issues/new?template=bug_report.md) |
| An idea or a missing capability | [Feature request](https://github.com/AbhiDevepl/linux-app-platform/issues/new?template=feature_request.md) |
| Docs are wrong, unclear, or missing | [Documentation issue](https://github.com/AbhiDevepl/linux-app-platform/issues/new?template=documentation.md) |
| An application is missing from the catalog | Feature request, with your verification sources — see [`docs/catalog.md`](docs/catalog.md) |
| A security vulnerability | **Not a public issue** — follow [`SECURITY.md`](SECURITY.md) |
| A question about how something works | Open an issue and say it is a question; GitHub Discussions is not enabled yet |

## What to include

A question that includes your OS and distribution, your Node and pnpm versions
(`node -v`, `pnpm -v`), the commit you are on (`git rev-parse --short HEAD`), the exact
command you ran, and the full output gets a useful answer on the first reply. One that does
not, usually gets a request for those details.

## Response times

Expect days, not hours — and longer around busy periods. Following up on an issue after a
week is fine and welcome; it is not nagging.

## What is not supported

- Installing software on your machine. **Nothing in this project installs anything yet**,
  by design — see [`ROADMAP.md`](ROADMAP.md).
- Distributions other than Ubuntu, Debian, Fedora, and Arch Linux. Support for others is a
  contribution, not a request queue.
- Deployment, hosting, or production use. Nothing here is production-ready.
