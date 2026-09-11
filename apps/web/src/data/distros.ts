/**
 * Manually selectable Linux distributions for Phase 1.
 *
 * Browsers cannot reliably identify the exact distribution a visitor is
 * running (see `src/hooks/useLinuxDetection.ts`), so distribution choice is
 * always a manual, explicit selection — never inferred. Descriptions are
 * short, general, well-known facts about each distribution's identity —
 * not installation claims.
 */

export interface DistroInfo {
  name: string;
  description: string;
}

export const DISTROS: DistroInfo[] = [
  { name: 'Ubuntu', description: 'Popular, beginner-friendly Debian-based distribution.' },
  { name: 'Debian', description: 'Stable, community-driven distribution Ubuntu is built on.' },
  { name: 'Fedora', description: 'Cutting-edge distribution backed by Red Hat.' },
  { name: 'Arch Linux', description: 'Minimal, rolling-release distribution for hands-on users.' },
];

export type Distro = (typeof DISTROS)[number]['name'];
