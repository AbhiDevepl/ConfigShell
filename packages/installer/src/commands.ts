/**
 * Command generation — the only code in this repository that knows what a
 * package manager's command line looks like.
 *
 * Everything here is deliberately narrow:
 *
 * 1. **Fixed vocabulary.** Each method has one hard-coded command form. There
 *    is no template string a caller can influence and no pass-through of
 *    user-supplied flags or arguments.
 * 2. **Re-validation at the boundary.** Every identifier is checked against a
 *    strict pattern immediately before interpolation, even though the catalog
 *    validator already checked it. This function is the last line of defence
 *    and does not assume its inputs were validated upstream.
 * 3. **Fail closed.** An identifier that does not match is a thrown error, not
 *    a quoted-and-hoped-for-the-best interpolation.
 * 4. **No `-y` / `--noconfirm`.** ConfigShell's plan review is one
 *    confirmation; the package manager's own prompt is a second, and it costs
 *    nothing to keep. The user is running this command themselves.
 *
 * The browser never executes any of this. Neither does the server. The output
 * is text for a human to read and paste into their own terminal.
 */

import type { InstallMethod } from '@configshell/catalog';
import type {
  InstallStep,
  ManualStep,
  PlanStep,
  RenderedCommand,
  RenderedPlan,
  SetupPlan,
  UnavailableInstall,
} from './types.ts';

/**
 * What a package identifier may contain.
 *
 * Covers every identifier form the catalog uses — APT/DNF/pacman package names
 * (`docker-ce`, `docker.io`, `g++`), reverse-DNS Flatpak application IDs
 * (`org.mozilla.firefox`) and Snap names (`sublime-text`) — and nothing else.
 * No whitespace, no quotes, no `;` `&` `|` `$` `` ` `` `(` `)` `<` `>` `\` `*`
 * `?` `~` `!` `#`, and no leading `-` (which would read as a flag).
 */
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/;

/** Same rule for verification binaries. Kept separate so the two can diverge. */
const BINARY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/;

export class UnsafeIdentifierError extends Error {
  constructor(
    readonly value: string,
    readonly kind: 'identifier' | 'binary',
  ) {
    super(
      `Refusing to build a command: ${kind} ${JSON.stringify(value)} is not a plain ` +
        `package name. This is a catalog-integrity failure, not a user error.`,
    );
    this.name = 'UnsafeIdentifierError';
  }
}

function safeIdentifier(value: string): string {
  if (typeof value !== 'string' || !IDENTIFIER_PATTERN.test(value)) {
    throw new UnsafeIdentifierError(String(value), 'identifier');
  }
  return value;
}

function safeBinary(value: string): string {
  if (typeof value !== 'string' || !BINARY_PATTERN.test(value)) {
    throw new UnsafeIdentifierError(String(value), 'binary');
  }
  return value;
}

/**
 * The install command for a method, given already-validated identifiers.
 *
 * `pacman` uses `-Syu` rather than a separate `-Sy` plus `-S`: refreshing
 * without upgrading leaves an Arch system in the partial-upgrade state its
 * maintainers explicitly warn against. `--needed` keeps it idempotent.
 *
 * `flatpak` is always `--user`, which is what makes it the one unprivileged
 * install route (see `policy.ts`).
 */
function installCommand(method: InstallMethod, identifiers: readonly string[]): string {
  // Fail closed on an empty group rather than emitting `sudo apt-get install `
  // with no operand. `buildPlan` never produces one, but `renderPlan` is public
  // API and does not assume its input came from there — and the finished-string
  // check in `setup-plan.ts` would *accept* the trailing space, so this is the
  // only place it can be caught.
  if (identifiers.length === 0) {
    throw new Error(`Refusing to build an install command for ${method} with no packages.`);
  }
  const packages = identifiers.map(safeIdentifier).join(' ');
  switch (method) {
    case 'apt':
      return `sudo apt-get install ${packages}`;
    case 'dnf':
      return `sudo dnf install ${packages}`;
    case 'pacman':
      return `sudo pacman -Syu --needed ${packages}`;
    case 'zypper':
      return `sudo zypper install ${packages}`;
    case 'flatpak':
      return `flatpak install --user flathub ${packages}`;
    case 'snap':
      return `sudo snap install ${packages}`;
    case 'official':
      // Unreachable: `official` sources resolve to a manual step, which carries
      // no command. Throwing keeps that invariant enforced rather than assumed.
      throw new Error('official sources have no generated command — they are manual steps');
  }
}

const REFRESH_COMMAND = {
  apt: 'sudo apt-get update',
  dnf: 'sudo dnf makecache',
  pacman: 'sudo pacman -Sy',
  zypper: 'sudo zypper refresh',
} as const;

/**
 * Verification commands (PRD §23).
 *
 * Generated from one fixed template per binary — `command -v <binary>` — never
 * from per-application text. The catalog has no field that could carry a check
 * command, and that is deliberate: it is precisely the field through which
 * arbitrary strings would reach a shell.
 *
 * One command per binary rather than one combined invocation, because POSIX
 * `command -v` takes a single operand.
 */
function verifyCommands(binaries: readonly string[]): readonly string[] {
  return binaries.map((binary) => `command -v ${safeBinary(binary)}`);
}

function renderStep(step: PlanStep): readonly RenderedCommand[] {
  switch (step.kind) {
    case 'refresh-metadata':
      return [
        {
          command: REFRESH_COMMAND[step.ecosystem],
          privileged: step.privileged,
          summary: step.summary,
          stepKind: step.kind,
        },
      ];

    case 'install': {
      const install = step as InstallStep;
      return [
        {
          command: installCommand(install.method, install.identifiers),
          privileged: install.privileged,
          summary: install.summary,
          stepKind: install.kind,
          ...(install.note ? { note: install.note } : {}),
        },
      ];
    }

    case 'verify':
      // One command per application, each with its own summary. Repeating
      // "Verify 4 installations" on four consecutive lines tells the reader
      // nothing about which line checks what.
      return verifyCommands(step.binaries).map((command, index) => ({
        command,
        privileged: false,
        summary: `Check ${step.applicationNames[index] ?? step.binaries[index]} is installed`,
        stepKind: step.kind,
      }));

    case 'manual':
      // Nothing safe to generate. The step survives into `manualSteps`.
      return [];
  }
}

/**
 * Render a plan into commands.
 *
 * Pure and total: throws only on a catalog-integrity failure (an identifier
 * that should never have passed validation), which is a bug worth surfacing
 * loudly rather than a condition to degrade around.
 */
export function renderPlan(plan: SetupPlan): RenderedPlan {
  const commands: RenderedCommand[] = [];
  const manualSteps: ManualStep[] = [];

  for (const step of plan.steps) {
    if (step.kind === 'manual') {
      manualSteps.push(step);
      continue;
    }
    commands.push(...renderStep(step));
  }

  return {
    environment: plan.environment,
    commands,
    manualSteps,
    unavailable: plan.unavailable as readonly UnavailableInstall[],
    privilegedCount: commands.filter((c) => c.privileged).length,
  };
}

/** Exported for tests and for anything that needs the same guarantee. */
export { IDENTIFIER_PATTERN, safeBinary, safeIdentifier };
