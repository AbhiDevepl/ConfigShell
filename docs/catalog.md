# Application catalog

## Current state: Phase 1 mock catalog (UI only)

There is no real catalog yet. What exists is a small, hand-written mock catalog at
`apps/web/src/data/mockCatalog.ts`, built only so the browsing/search/selection UI in
Phase 1 had something to render. Treat it as UI fixture data, not as a statement about what
is actually installable on any distribution.

Current shape:

```ts
type Category =
  | 'Browsers'
  | 'Code Editors'
  | 'CLI Tools'
  | 'Development'
  | 'Utilities'
  | 'Media'
  | 'Communication';

interface MockApp {
  id: string;
  name: string;
  category: Category;
  description: string;
}
```

Deliberately **not** present in the mock entries: package names, package-manager mappings,
supported-distribution lists, icons/logos, homepage links, or version numbers. None of that
has been verified against official sources, so none of it is claimed. The 17 entries in the
mock catalog were picked only to give every category something to show in the UI (search,
filtering, empty states); they are not a curated or vetted list.

## Planned: the real catalog

The real catalog (not yet started) is meant to be the single source of truth for
application installation metadata, structured similarly to:

```
id
name
description
category
icon
homepage
installation methods
supported distributions
package identifiers
official source
```

Design constraints for when this is built:

- Catalog data must stay a structured, curated source — not scattered across React
  components (see `docs/architecture.md`).
- Application entries track an installation identifier/source (e.g. `package: firefox`),
  not manually maintained version numbers — the OS package manager or official source is
  responsible for versions, not this catalog.
- Package names and package-manager support must be verified against official sources
  (official distro docs, official package repositories, Flathub, Snap) before being added
  — never invented or assumed.
- Terminal commands generated from catalog data (a later phase) must be deterministic and
  inspectable, and only ever built from trusted catalog entries — never from arbitrary user
  input.

This section will be rewritten once real catalog work starts; until then, nothing above
"Current state" should be treated as implemented.
