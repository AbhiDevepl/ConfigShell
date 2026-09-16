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

export type Distro = 'Ubuntu' | 'Debian' | 'Fedora' | 'Arch Linux' | 'openSUSE';

export const DISTROS: readonly Distro[] = [
  'Ubuntu',
  'Debian',
  'Fedora',
  'Arch Linux',
  'openSUSE',
] as const;

/**
 * The lineage a distribution belongs to.
 *
 * Distinct from `PackageEcosystem` even though they currently line up one to
 * one, because they answer different questions. The ecosystem decides which
 * command installs a package; the family decides which distribution's packaging
 * conventions apply. Linux Mint and Pop!_OS would both be `debian` family and
 * `apt` ecosystem; a hypothetical distribution that switched package managers
 * would keep its family and change its ecosystem.
 *
 * Nothing resolves on family today. It is here because adding a distribution is
 * meant to be a data change, and "which family is this?" is part of that data.
 */
export type DistroFamily = 'debian' | 'fedora' | 'arch' | 'suse';

export const DISTRO_FAMILIES: Record<Distro, DistroFamily> = {
  Ubuntu: 'debian',
  Debian: 'debian',
  Fedora: 'fedora',
  'Arch Linux': 'arch',
  openSUSE: 'suse',
} as const;

/**
 * The operating system an environment runs. Linux is the only supported value
 * and the only one the catalog carries data for.
 *
 * This axis exists *now*, with exactly one member, on purpose: every type below
 * is otherwise Linux-shaped, and retrofitting an OS distinction after a resolver
 * and a plan model are built would touch all of them. Adding `'macos'` later is
 * a data problem; adding the axis later would be a refactor. Do **not** add
 * another value until there is verified catalog data behind it.
 */
export type OperatingSystem = 'linux';

export const OPERATING_SYSTEMS: readonly OperatingSystem[] = ['linux'] as const;

/**
 * A distribution's *native* package ecosystem — the package manager that ships
 * with it and whose repositories it is built around.
 *
 * Deliberately narrower than `InstallMethod`: `flatpak` and `snap` are
 * cross-distribution add-ons, not any distribution's native ecosystem, and
 * `official` is not a package manager at all. Every ecosystem here is also an
 * `InstallMethod`, which is what lets resolution match one against the other.
 */
export type PackageEcosystem = 'apt' | 'dnf' | 'pacman' | 'zypper';

export const PACKAGE_ECOSYSTEMS: readonly PackageEcosystem[] = [
  'apt',
  'dnf',
  'pacman',
  'zypper',
] as const;

/**
 * Which distributions belong to each native package ecosystem.
 *
 * This is the single home for that knowledge. `validate.ts` uses it to reject
 * impossible sources ("dnf on Arch Linux"), and `environment.ts` inverts it to
 * derive an environment's ecosystem from its distribution. Adding a
 * distribution means adding it here and nowhere else.
 */
export const ECOSYSTEM_DISTROS: Record<PackageEcosystem, readonly Distro[]> = {
  apt: ['Ubuntu', 'Debian'],
  dnf: ['Fedora'],
  pacman: ['Arch Linux'],
  zypper: ['openSUSE'],
} as const;

/**
 * CPU architecture. Recorded because PRD FR-001 asks for it and because it is
 * cheaper to carry than to add later.
 *
 * **Nothing resolves on it today.** The catalog holds no per-architecture data,
 * so resolution ignores this field entirely rather than pretending to filter on
 * it. It is optional on `Environment` for exactly that reason.
 */
export type Architecture = 'x86_64' | 'aarch64';

export const ARCHITECTURES: readonly Architecture[] = ['x86_64', 'aarch64'] as const;

/**
 * Where the user wants to install something — the second half of every
 * resolution question, the first half being the application.
 *
 * Always an explicit, validated value. It is never inferred from a browser user
 * agent: the web app can tell that a visitor *looks like* they are on Linux and
 * nothing more, so the distribution is always a deliberate choice. Real system
 * detection is a local-agent capability that does not exist yet.
 */
export interface Environment {
  os: OperatingSystem;
  distro: Distro;
  /** Derived from `distro` — never supplied independently. See `environment.ts`. */
  family: DistroFamily;
  /** Derived from `distro` — never supplied independently. See `environment.ts`. */
  ecosystem: PackageEcosystem;
  /** Optional, recorded only. Does not affect resolution — see `Architecture`. */
  architecture?: Architecture;
}

/**
 * How an application can be obtained. `official` means the vendor's own
 * download/installer for cases where no package-manager route is verified.
 */
export type InstallMethod =
  | 'apt'
  | 'dnf'
  | 'pacman'
  | 'zypper'
  | 'flatpak'
  | 'snap'
  | 'official';

export const INSTALL_METHODS: readonly InstallMethod[] = [
  'apt',
  'dnf',
  'pacman',
  'zypper',
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

/**
 * How to check that an application is actually present after installation.
 *
 * Deliberately a closed shape with exactly one field, not a free-text command.
 * The resolver builds a check from a fixed template (`command -v <binary>`); it
 * must never be handed a per-application string to run, which is precisely the
 * "arbitrary strings reach a shell" failure the security model forbids.
 */
export interface Verification {
  /**
   * The command the installed package places on `PATH` — `git`, `nvim`, `code`.
   * Subject to the same rule as every other identifier here: verified or
   * omitted, never guessed.
   */
  binary: string;
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
  /**
   * How to verify the application afterwards. Optional, and absence means
   * "no binary name has been verified" — not "unverifiable". Several entries
   * legitimately have none: applications distributed only as Flatpaks or Snaps
   * may put nothing predictable on `PATH`, and a binary whose name differs
   * between distributions is omitted rather than guessed at.
   */
  verify?: Verification;
}
