# Maintainers

This project is currently maintained by two people. This file describes who maintains what
and how the roles work — it is the governance model, deliberately kept small for a project
of this size.

## Current maintainers

| Name | GitHub | Areas |
| ---- | ------ | ----- |
| Abhi | [@AbhiDevepl](https://github.com/AbhiDevepl) | Repository owner; all areas |
| Tejas | `tejjasdev` — ⚠️ handle needs confirmation before it is used in `.github/CODEOWNERS` | All areas |

> The second row is taken from the author line in `README.md` and the commit history. The
> repository owner should confirm the exact GitHub handle and then add it to
> [`.github/CODEOWNERS`](.github/CODEOWNERS), which currently lists only `@AbhiDevepl` —
> an unrecognised username silently invalidates the whole CODEOWNERS file.

No other names appear here, and none should be added without that person's agreement.

## Roles

**Maintainers** can merge pull requests, cut releases, and change repository settings. They
are responsible for reviews, for the project's direction, and for enforcing the
[Code of Conduct](CODE_OF_CONDUCT.md).

**Reviewers** (none appointed yet) can review and approve pull requests in an area they
know well, but do not merge. This role exists so that review load can be shared before
someone takes on full maintainership.

**Contributors** are everyone who opens an issue or a pull request. No permissions are
needed, and no contribution is too small to count.

## How maintainership is earned

There is no application process. A contributor becomes a candidate for reviewer, and later
maintainer, by doing the work over time:

- A sustained record of merged, high-quality pull requests.
- Reviews of other people's pull requests that a maintainer would have written anyway.
- Good judgement about scope — knowing what this project should *not* do, especially around
  the [security invariants](docs/security.md).
- Reliability: following through on what they pick up, and saying so when they cannot.

Existing maintainers propose and agree on the change, and the person has to want the role.
Maintainers who become inactive can step back to contributor status at any time, with no
hard feelings; a maintainer who is unreachable for a long stretch may be moved to an
"emeritus" line here so the list stays accurate.

## Who decides what

| Decision | Who |
| -------- | --- |
| Routine bug fix, docs, catalog entry | Any maintainer, one approval |
| New dependency | Any maintainer, but it must be justified in the pull request |
| Architectural change — new layer, API boundary, workspace restructuring, build tooling | Agreement between **both** maintainers, discussed in an issue first |
| Anything touching the security invariants in [`docs/security.md`](docs/security.md) | Agreement between **both** maintainers; the invariants themselves are not up for trade |
| Releases and version numbers | Repository owner |
| Code of Conduct enforcement | Maintainers, per [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) |

## Review expectations

Maintainers aim to acknowledge a pull request within about a week. Reviews are expected to
be specific and actionable, and to say plainly when something will not be merged and why —
a fast, clear "no, because …" respects a contributor's time more than silence does.

Maintainers do not merge their own non-trivial pull requests without a second pair of eyes
when the other maintainer is available.
