/**
 * Setup-plan generation (PRD §20).
 *
 * Turns resolutions into an ordered list of steps. The plan is **data**: it
 * contains no command text, and it is deterministic — the same selection,
 * environment and catalog always produce exactly the same plan.
 *
 * Ordering is not cosmetic. Metadata refresh has to precede installs, installs
 * are grouped so each package manager runs once rather than once per
 * application, manual steps come after everything automatic, and verification
 * runs last because it is checking the result of all of it.
 */

import type { Environment, InstallMethod } from '@configshell/catalog';
import { isNativeEcosystemMethod, isPrivilegedMethod } from './policy.ts';
import type {
  InstallStep,
  ManualStep,
  PlanStep,
  ResolvedInstall,
  Resolution,
  SetupPlan,
  UnavailableInstall,
  VerifyStep,
} from './types.ts';

/**
 * Install methods in the order their steps appear. The environment's own
 * package manager first — it is the most trusted route and the one most likely
 * to satisfy dependencies for everything after it.
 */
function methodOrder(environment: Environment): readonly InstallMethod[] {
  return [environment.ecosystem, 'flatpak', 'snap'];
}

/**
 * Whether this ecosystem needs an explicit metadata refresh before installing.
 *
 * Only apt does. `dnf` refreshes expired metadata on its own, and for pacman
 * ConfigShell renders `-Syu`, which refreshes as part of the same command —
 * issuing a bare `pacman -Sy` first would set up exactly the partial-upgrade
 * state Arch warns against.
 */
function needsRefreshStep(ecosystem: Environment['ecosystem']): boolean {
  return ecosystem === 'apt';
}

const REFRESH_SUMMARY: Record<Environment['ecosystem'], string> = {
  apt: 'Update APT package metadata',
  dnf: 'Refresh DNF metadata',
  pacman: 'Synchronise pacman databases',
};

function installSummary(method: InstallMethod, count: number): string {
  const noun = count === 1 ? 'application' : 'applications';
  switch (method) {
    case 'apt':
      return `Install ${count} ${noun} with APT`;
    case 'dnf':
      return `Install ${count} ${noun} with DNF`;
    case 'pacman':
      return `Install ${count} ${noun} with pacman`;
    case 'flatpak':
      return `Install ${count} ${noun} from Flathub (per-user, no root)`;
    case 'snap':
      return `Install ${count} ${noun} from the Snap Store`;
    case 'official':
      return `Install ${count} ${noun} from the vendor`;
  }
}

/**
 * Flatpak's one precondition. Stated as a note rather than solved with a
 * generated `flatpak remote-add`: adding a remote is repository setup, which is
 * exactly what ConfigShell does not generate today (Q1).
 */
const FLATHUB_NOTE =
  'Requires the Flathub remote. Most distributions ship it; if yours does not, ' +
  'add it by following https://flathub.org/setup before running this step.';

export function buildPlan(
  resolutions: readonly Resolution[],
  environment: Environment,
): SetupPlan {
  const resolved = resolutions.filter((r): r is ResolvedInstall => r.outcome === 'resolved');
  const unavailable = resolutions.filter(
    (r): r is UnavailableInstall => r.outcome === 'unavailable',
  );

  const steps: PlanStep[] = [];

  // Group resolved installs by method, preserving selection order within each
  // group so the plan is stable and reviewable.
  const byMethod = new Map<InstallMethod, ResolvedInstall[]>();
  for (const install of resolved) {
    const list = byMethod.get(install.source.method) ?? [];
    list.push(install);
    byMethod.set(install.source.method, list);
  }

  const usesNativeEcosystem = byMethod.has(environment.ecosystem);
  if (usesNativeEcosystem && needsRefreshStep(environment.ecosystem)) {
    steps.push({
      kind: 'refresh-metadata',
      ecosystem: environment.ecosystem,
      privileged: true,
      summary: REFRESH_SUMMARY[environment.ecosystem],
    });
  }

  for (const method of methodOrder(environment)) {
    const installs = byMethod.get(method);
    if (!installs || installs.length === 0) continue;

    const step: InstallStep = {
      kind: 'install',
      method,
      privileged: isPrivilegedMethod(method),
      identifiers: installs.map((i) => i.source.identifier),
      applicationIds: installs.map((i) => i.application.id),
      summary: installSummary(method, installs.length),
      ...(method === 'flatpak' ? { note: FLATHUB_NOTE } : {}),
    };
    steps.push(step);
  }

  // Manual steps after everything automatic: the user works through the
  // generated commands first, then the handful that need them personally.
  for (const resolution of resolutions) {
    if (resolution.outcome !== 'manual') continue;
    const step: ManualStep = {
      kind: 'manual',
      privileged: false,
      applicationId: resolution.application.id,
      applicationName: resolution.application.name,
      reason: resolution.reason,
      ...(resolution.url ? { url: resolution.url } : {}),
      summary:
        resolution.reason === 'repository-setup-required'
          ? `Install ${resolution.application.name} yourself — it needs a vendor repository first`
          : `Install ${resolution.application.name} yourself — vendor download only`,
    };
    steps.push(step);
  }

  // Verification last, and only for applications this plan actually installs
  // through a route that puts a binary on PATH. Verifying something the plan
  // did not install would report a failure the plan is not responsible for.
  const verifiable = resolved.filter(
    (install) => install.application.verify !== undefined && install.source.method !== 'flatpak',
  );
  if (verifiable.length > 0) {
    const verifyStep: VerifyStep = {
      kind: 'verify',
      privileged: false,
      binaries: verifiable.map((i) => i.application.verify!.binary),
      applicationIds: verifiable.map((i) => i.application.id),
      summary: `Verify ${verifiable.length} installation${verifiable.length === 1 ? '' : 's'}`,
    };
    steps.push(verifyStep);
  }

  return { environment, steps, unavailable, resolutions };
}

/** Re-exported so plan consumers need not know where these live. */
export { isNativeEcosystemMethod, isPrivilegedMethod };
