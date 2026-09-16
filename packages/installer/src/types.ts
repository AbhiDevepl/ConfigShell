/**
 * The deterministic core's data model.
 *
 * Three stages, each a pure function of the previous one's output:
 *
 *     resolve()      (application, environment) → which source, and why
 *     buildPlan()    (resolutions)              → ordered steps, as DATA
 *     renderPlan()   (plan)                     → command strings
 *
 * The separation is the security model, not tidiness. Only `renderPlan` knows
 * that `apt` means `apt-get install`; everything before it is structured data
 * that cannot contain a shell fragment. That boundary is what makes the
 * dangerous step small enough to test exhaustively, and it is what lets a
 * future CLI or MCP server reuse resolution and planning without inheriting
 * command generation.
 *
 * Nothing in this package executes anything, reads the filesystem, or makes a
 * network request.
 */

import type {
  Application,
  Environment,
  InstallMethod,
  InstallationSource,
  PackageEcosystem,
} from '@configshell/catalog';

// ---------------------------------------------------------------- resolution

/**
 * Why a source was not usable directly. Every value here is a *knowable*
 * outcome — something the catalog and the environment settle between them,
 * with nothing executed and nothing guessed.
 */
export type UnresolvedReason =
  /** Verified sources exist, but none for this distribution. */
  | 'no-source-for-environment'
  /** The entry has no verified installation source at all. */
  | 'no-verified-source'
  /**
   * The only routes need a third-party repository added first. Provisional:
   * see `policy.ts` and docs/TechnicalAudit.md §9 (Q1).
   */
  | 'repository-setup-required'
  /** The only route is the vendor's own download page. */
  | 'official-download-only';

/** A source that was considered, and what the policy decided about it. */
export interface ConsideredSource {
  source: InstallationSource;
  /** Lower is better. `null` means the policy excluded it outright. */
  rank: number | null;
  /** Plain-language explanation, safe to show a user. */
  note: string;
}

/** A source was chosen. This application can be installed with a command. */
export interface ResolvedInstall {
  outcome: 'resolved';
  application: Application;
  source: InstallationSource;
  /** Why this source won, in the user's words rather than the policy's. */
  reason: string;
  considered: readonly ConsideredSource[];
}

/**
 * No command can be generated, but the user has somewhere to go. Manual steps
 * are a first-class outcome, not a failure: pretending an application is
 * unavailable because it needs a vendor download would be dishonest, and
 * silently dropping it would be worse.
 */
export interface ManualInstall {
  outcome: 'manual';
  application: Application;
  reason: Extract<UnresolvedReason, 'repository-setup-required' | 'official-download-only'>;
  /** Vendor instructions, when the catalog has them. */
  url?: string;
  explanation: string;
  considered: readonly ConsideredSource[];
}

/** Nothing verified applies here. Stated plainly; never papered over. */
export interface UnavailableInstall {
  outcome: 'unavailable';
  application: Application;
  reason: Extract<UnresolvedReason, 'no-source-for-environment' | 'no-verified-source'>;
  explanation: string;
  considered: readonly ConsideredSource[];
}

export type Resolution = ResolvedInstall | ManualInstall | UnavailableInstall;

// --------------------------------------------------------------------- plan

/**
 * Whether a step changes the system as root.
 *
 * Derived from the install method, never from inspecting a command string —
 * scanning generated text for "sudo" would make the security property depend
 * on the formatting of the thing it is meant to guard.
 */
export type Privileged = boolean;

/** Refresh package metadata before installing. */
export interface RefreshStep {
  kind: 'refresh-metadata';
  ecosystem: PackageEcosystem;
  privileged: true;
  summary: string;
}

/** Install one or more applications through a single method, in one command. */
export interface InstallStep {
  kind: 'install';
  method: InstallMethod;
  privileged: Privileged;
  /** Catalog identifiers only. Never user input. */
  identifiers: readonly string[];
  applicationIds: readonly string[];
  summary: string;
  /** A precondition the user must satisfy themselves, if any. */
  note?: string;
}

/** Something the user does by hand, outside any generated command. */
export interface ManualStep {
  kind: 'manual';
  privileged: false;
  applicationId: string;
  applicationName: string;
  reason: ManualInstall['reason'];
  url?: string;
  summary: string;
}

/** Check that what was installed is actually present. Never privileged. */
export interface VerifyStep {
  kind: 'verify';
  privileged: false;
  /** Binary names from the catalog, already pattern-checked. */
  binaries: readonly string[];
  applicationIds: readonly string[];
  /** Parallel to `binaries`, so each rendered check can name its application. */
  applicationNames: readonly string[];
  summary: string;
}

export type PlanStep = RefreshStep | InstallStep | ManualStep | VerifyStep;

/**
 * An ordered setup plan. Deterministic: the same (selection, environment,
 * catalog) always produces exactly this, byte for byte.
 *
 * Contains **no command strings**. Rendering is a separate stage.
 */
export interface SetupPlan {
  environment: Environment;
  steps: readonly PlanStep[];
  /** Applications with no route at all, kept so the UI can say so out loud. */
  unavailable: readonly UnavailableInstall[];
  resolutions: readonly Resolution[];
}

// ------------------------------------------------------------------ rendered

/** One shell command, plus everything a user needs to judge it before running. */
export interface RenderedCommand {
  /** The exact text the user copies. Built only from validated catalog data. */
  command: string;
  privileged: Privileged;
  summary: string;
  stepKind: PlanStep['kind'];
  /**
   * A precondition for *this* command, carried through from its step.
   *
   * Attached here rather than left on the step for a consumer to match up:
   * a renderer that has to guess which command a note belongs to will
   * eventually attach it to the wrong one, and a misplaced "requires the
   * Flathub remote" on an APT command is worse than no note at all.
   */
  note?: string;
}

/**
 * A plan with commands attached.
 *
 * Manual steps deliberately carry no command — there is nothing safe to
 * generate for them, and inventing one would defeat the point of the
 * distinction.
 */
export interface RenderedPlan {
  environment: Environment;
  commands: readonly RenderedCommand[];
  manualSteps: readonly ManualStep[];
  unavailable: readonly UnavailableInstall[];
  /** Every privileged command, for the "this needs root" warning. */
  privilegedCount: number;
}
