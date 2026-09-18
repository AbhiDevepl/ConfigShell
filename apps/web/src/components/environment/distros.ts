/**
 * Presentation copy for the distribution selector.
 *
 * The set of supported distributions itself belongs to the catalog package —
 * it has to match what catalog entries declare support for — so `Distro` is
 * imported rather than redefined here. This file only adds the short,
 * UI-facing descriptions. Those describe each distribution's identity; they
 * are never installation claims.
 *
 * Browsers cannot reliably identify the exact distribution a visitor is
 * running (see `src/hooks/useLinuxDetection.ts`), so distribution choice is
 * always a manual, explicit selection — never inferred.
 */

import type { Distro } from '@configshell/catalog';

export type { Distro };

export interface DistroInfo {
  name: Distro;
  description: string;
}

export const DISTROS: DistroInfo[] = [
  { name: 'Ubuntu', description: 'Popular, beginner-friendly Debian-based distribution.' },
  { name: 'Fedora', description: 'Cutting-edge distribution backed by Red Hat.' },
  { name: 'Arch Linux', description: 'Minimal, rolling-release distribution for hands-on users.' },
  { name: 'openSUSE', description: 'Enterprise-grade distribution using the zypper package manager.' },
];
