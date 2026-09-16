/**
 * The canonical setup plan: one shape, built once, returned by every adapter.
 *
 * `buildPlan` and `renderPlan` produce *domain* values — they carry whole
 * `Application` objects, the policy's internal rank integer, and step
 * bookkeeping no caller outside this package needs. Turning those into the
 * thing an HTTP response or an MCP tool result actually contains is what this
 * module does.
 *
 * ## Why it lives here
 *
 * It was previously done twice: once in `apps/server/services/plan.service.js`
 * and once in the `generate_setup` handler in `packages/mcp`. The two drifted,
 * as duplicated contracts do — the HTTP plan grew `summary.executed` while the
 * MCP plan grew a richer `execution` block, and HTTP's manual steps leaked the
 * internal `kind`/`privileged` step fields that MCP's did not. Cross-adapter
 * tests compared the fields both happened to share, so neither difference
 * failed anything.
 *
 * Both adapters depend on this package already, so assembling the plan here
 * makes agreement structural rather than tested: there is one builder, and a
 * field cannot exist on one adapter's plan and not the other's.
 *
 * ## The boundary
 *
 * Nothing here executes anything. The plan is a proposal — text a user reads
 * and runs themselves. See the package README and `docs/agent.md`.
 */

import type { Application, Environment } from '@configshell/catalog';
import { renderPlan } from './commands.ts';
import { buildPlan } from './plan.ts';
import { resolveAll } from './resolve.ts';
import type { Resolution } from './types.ts';

/**
 * What a generated command may contain, as an allowlist.
 *
 * A denylist of shell metacharacters answers "which of the dangerous ones did
 * we remember"; an allowlist answers "is this the small, boring shape we
 * intend". Every command this package generates is a package-manager
 * invocation over validated identifiers, so the allowlist is genuinely this
 * narrow — and `validateSetupPlan` enforces it on the finished string, after
 * interpolation, which is the last point anything can be checked.
 */
export const SAFE_COMMAND_PATTERN = /^[A-Za-z0-9 _.+-]+$/;

/**
 * Flatten a resolution for the wire.
 *
 * `considered` is included deliberately: a user — or a model explaining the
 * choice to one — is entitled to see which sources were rejected and why, not
 * just which one won.
 */
export function presentResolution(resolution: Resolution) {
  const base = {
    applicationId: resolution.application.id,
    applicationName: resolution.application.name,
    outcome: resolution.outcome,
    considered: resolution.considered.map((candidate) => ({
      method: candidate.source.method,
      identifier: candidate.source.identifier,
      origin: candidate.source.origin,
      // `eligible`, not the internal rank integer: a consumer needs to know
      // whether a source could be used here and why, not where it sits in the
      // policy's ordering.
      eligible: candidate.rank !== null,
      note: candidate.note,
    })),
  };

  if (resolution.outcome === 'resolved') {
    return {
      ...base,
      source: {
        method: resolution.source.method,
        identifier: resolution.source.identifier,
        origin: resolution.source.origin,
      },
      reason: resolution.reason,
    };
  }

  return {
    ...base,
    reason: resolution.reason,
    explanation: resolution.explanation,
    ...(resolution.outcome === 'manual' && resolution.url ? { url: resolution.url } : {}),
  };
}

/**
 * How much of the selection ConfigShell produced a command for.
 *
 * - `complete` — every selected application resolved to a command.
 * - `partial` — some did; the rest need a manual step or have no verified
 *   route here. The plan is still useful and is returned in full.
 * - `none` — nothing resolved to a command. There may still be manual steps;
 *   `summary` says which.
 *
 * A selection where one application is unavailable is a partial success, not a
 * failure, and saying so in one field saves every caller from re-deriving it
 * from the counts.
 */
export type PlanStatus = 'complete' | 'partial' | 'none';

/**
 * Resolve → plan → render → present, for one selection and one environment.
 *
 * Takes applications rather than ids: looking an id up and refusing an unknown
 * one is the adapter's job, because refusal looks different over HTTP than it
 * does over MCP. By the time a selection reaches here it is known-good.
 *
 * Deterministic. The same arguments give a byte-identical result: no clock, no
 * randomness, no generated ids.
 */
export function presentSetupPlan(
  applications: readonly Application[],
  environment: Environment,
) {
  const resolutions = resolveAll(applications, environment);
  const plan = buildPlan(resolutions, environment);
  const rendered = renderPlan(plan);

  const installable = resolutions.filter((r) => r.outcome === 'resolved').length;
  const selected = applications.length;

  const presented = {
    environment,
    /** See `PlanStatus`. Covers the whole selection, not one application. */
    status: (installable === selected && selected > 0
      ? 'complete'
      : installable === 0
        ? 'none'
        : 'partial') as PlanStatus,
    /** What was decided for each selected application, and why. */
    resolutions: resolutions.map(presentResolution),
    /** Ordered steps, as data. No command strings at this level. */
    steps: plan.steps,
    /** The commands to copy, in order, each marked privileged or not. */
    commands: rendered.commands.map((command) => ({
      command: command.command,
      privileged: command.privileged,
      summary: command.summary,
      stepKind: command.stepKind,
      ...(command.note ? { note: command.note } : {}),
    })),
    /** Applications the user must install themselves, with somewhere to go. */
    manualSteps: rendered.manualSteps.map((step) => ({
      applicationId: step.applicationId,
      applicationName: step.applicationName,
      reason: step.reason,
      summary: step.summary,
      ...(step.url ? { url: step.url } : {}),
    })),
    /** Applications with no verified route here, stated rather than dropped. */
    unavailable: plan.unavailable.map((entry) => ({
      applicationId: entry.application.id,
      applicationName: entry.application.name,
      reason: entry.reason,
      explanation: entry.explanation,
    })),
    summary: {
      selected,
      installable,
      manual: resolutions.filter((r) => r.outcome === 'manual').length,
      unavailable: resolutions.filter((r) => r.outcome === 'unavailable').length,
      privilegedCommands: rendered.privilegedCount,
    },
    /**
     * Stated rather than left to be inferred from the absence of a result.
     *
     * A host reading this plan is told, in the plan itself, that ConfigShell
     * ran nothing and that running it is the user's own act.
     */
    execution: {
      executed: false,
      executedBy: null,
      note:
        'ConfigShell never runs these. Installing is the user\'s own act in their own ' +
        'terminal. Automated execution would belong to the local agent, which does not ' +
        'exist.',
    },
  };

  validateSetupPlan(presented);
  return presented;
}

export type PresentedResolution = ReturnType<typeof presentResolution>;
export type PresentedSetupPlan = ReturnType<typeof presentSetupPlan>;

/**
 * Check the assembled plan against its own invariants, and throw if it fails.
 *
 * This is not input validation — the input was validated before it got here.
 * It is an output check on the last value before it leaves the process, which
 * is the only place some of these properties are observable at all.
 *
 * It throws rather than returning a flawed plan with a warning attached. A plan
 * that fails here is a bug in this package, and the honest response to "the
 * commands I generated do not look like commands I generate" is to produce
 * nothing.
 */
export function validateSetupPlan(plan: PresentedSetupPlan): void {
  const { summary, resolutions, commands } = plan;

  // Every selected application is accounted for exactly once. A resolution
  // quietly dropped would show up as a plan that does less than was asked.
  const outcomes = summary.installable + summary.manual + summary.unavailable;
  if (outcomes !== summary.selected || resolutions.length !== summary.selected) {
    throw new Error(
      `Invalid setup plan: ${summary.selected} selected but ${resolutions.length} ` +
        `resolutions and ${outcomes} outcomes.`,
    );
  }

  if (summary.privilegedCommands !== commands.filter((c) => c.privileged).length) {
    throw new Error('Invalid setup plan: privileged command count does not match commands.');
  }

  // The security property, checked on the finished string. `renderPlan`
  // validates identifiers before interpolating them; this re-checks the result
  // afterwards, so a future change to command formatting cannot introduce a
  // metacharacter without failing here.
  for (const { command } of commands) {
    if (!SAFE_COMMAND_PATTERN.test(command)) {
      throw new Error(`Invalid setup plan: unsafe command ${JSON.stringify(command)}.`);
    }
  }
}
