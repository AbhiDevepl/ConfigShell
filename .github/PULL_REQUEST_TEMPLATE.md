<!--
Thanks for contributing. Keep the pull request focused on one logical change.
See CONTRIBUTING.md for branch naming, commit conventions, and what reviewers look for.
-->

## Summary

<!-- What this changes and why, in two or three sentences. -->

## Related issue

<!-- "Closes #123", "Part of #123", or "None — small fix". Anything architectural should
have had an issue first. -->

## Changes

<!-- The main changes, one bullet each. Mention any file a reviewer should read first. -->

-
-

## Testing performed

<!-- What you actually ran and observed. "Should work" is not testing. -->

- [ ] `pnpm check` passes (lint → typecheck → test → build)
- [ ] Manually exercised the affected behaviour — describe how:

<!-- For catalog changes: list your verification source for EVERY identifier you added or
changed (distribution package database, Flathub, Snap Store, or official docs). A catalog
pull request without sources cannot be reviewed. -->

## Documentation

- [ ] Docs updated in this pull request
- [ ] No documentation change needed

<!-- If you changed a command, script, or environment variable, make sure it is correct
everywhere it appears: README.md, docs/, the workspace README, and CLAUDE.md. -->

## Breaking changes

- [ ] No
- [ ] Yes — described below, with what a user or contributor has to do

## Screenshots

<!-- Required for UI changes: before and after, and a narrow-viewport shot if the layout
is affected. Check both light and dark themes. -->

## Checklist

- [ ] One logical change; no unrelated edits or reformatting
- [ ] Follows the existing structure and conventions of the files it touches
- [ ] No new runtime dependency (or it is justified in the summary above)
- [ ] Nothing claims functionality that does not exist — in code, docs, or UI
- [ ] No secrets, tokens, or personal data in the diff, and no `.env` file committed
- [ ] Respects the security invariants in `docs/security.md` — no shell execution from the
      browser, no unvalidated input reaching a command, no silent system changes
- [ ] `CHANGELOG.md` updated under `## [Unreleased]` (user-visible changes only)
