/**
 * Catalog data model.
 *
 * Scope note: this describes *what an application is and where it comes from*.
 * It deliberately stops short of describing *how to install it* — no commands,
 * no flags, no shell strings. Turning an `InstallationSource` into an actual
 * command is the installer resolver's job (a later phase), and it is the only
 * thing that should ever need to know that `apt` means `apt install`.
 */

export type Category =
  | 'Browsers'
  | 'Code Editors'
  | 'CLI Tools'
  | 'Development'
  | 'Utilities'
  | 'Media'
  | 'Communication';

export const CATEGORIES: readonly Category[] = [
  'Browsers',
  'Code Editors',
  'CLI Tools',
  'Development',
  'Utilities',
  'Media',
  'Communication',
] as const;

export type Distro = 'Ubuntu' | 'Debian' | 'Fedora' | 'Arch Linux';

export const DISTROS: readonly Distro[] = ['Ubuntu', 'Debian', 'Fedora', 'Arch Linux'] as const;

/**
 * How an application can be obtained. `official` means the vendor's own
 * download/installer for cases where no package-manager route is verified.
 */
export type InstallMethod = 'apt' | 'dnf' | 'pacman' | 'flatpak' | 'snap' | 'official';

export const INSTALL_METHODS: readonly InstallMethod[] = [
  'apt',
  'dnf',
  'pacman',
  'flatpak',
  'snap',
  'official',
] as const;

/**
 * Who actually packages this. Worth recording because a lot of official-looking
 * reverse-DNS Flatpak IDs (`com.google.Chrome`, `com.brave.Browser`) are in fact
 * third-party repackagings that the vendor neither publishes nor supports —
 * presence on Flathub says the identifier is real, not that the vendor stands
 * behind it. A trusted catalog should not flatten that distinction away.
 *
 * - `distro`    — ships in a supported distribution's own repositories, or is
 *                 published by that distribution's vendor (e.g. Canonical's
 *                 Chromium snap).
 * - `vendor`    — published by the application's own project/vendor.
 * - `community` — packaged by a third party.
 */
export type RepositoryOrigin = 'distro' | 'vendor' | 'community';

export interface InstallationSource {
  method: InstallMethod;
  /**
   * The identifier the method uses: apt/dnf/pacman package name, Flatpak
   * application ID, or Snap name. Never invented — an unverified identifier is
   * omitted entirely rather than guessed (see docs/catalog.md).
   */
  identifier: string;
  origin: RepositoryOrigin;
  /**
   * Which of the supported distributions this source is verified for. Required
   * for apt/dnf/pacman, where availability is distribution-specific. Absent for
   * flatpak/snap/official, which are distribution-agnostic by design.
   */
  distros?: readonly Distro[];
  /** Where to get it, for `official` — or the repo setup docs for `vendor` origins. */
  url?: string;
}

export interface Application {
  /** Stable, unique, lowercase slug. Selection state in the UI is keyed on this. */
  id: string;
  name: string;
  /** One line. What the application is — never an installability claim. */
  description: string;
  category: Category;
  /** Official project/vendor homepage. */
  homepage: string;
  /**
   * Verified installation sources. An empty array is a legitimate state: it
   * means "nothing has been verified yet", not "not installable".
   */
  installation: readonly InstallationSource[];
}
