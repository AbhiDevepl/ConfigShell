/**
 * Setup-plan generation.
 *
 * A thin adapter over `@configshell/installer`. Every decision — which source,
 * in what order, with what privileges, and what the command actually is — is
 * made by that package's pure functions. This module exists to call them in the
 * right order and shape the result for HTTP.
 *
 * ## The boundary this module must not cross
 *
 * The server **plans and validates. It never executes.** There is no
 * `child_process` import here, and there must never be one. Running a generated
 * command is the user's own act, in their own terminal, on their own machine.
 *
 * Doing it for them would require a component that (a) runs on the user's
 * machine rather than on a server, (b) re-validates the plan locally, and
 * (c) asks for explicit confirmation before each privileged step. That is the
 * local agent described in `docs/agent.md`, and it does not exist. A server
 * that executed on a user's behalf would be remote sudo, which the security
 * model rules out permanently rather than as a matter of sequencing.
 */

import { buildPlan, renderPlan, resolveAll } from "@configshell/installer";
import { getApplications } from "./catalog.service.js";
import { presentResolution } from "./resolution.presenter.js";

/**
 * Resolve a selection against an environment, without planning.
 *
 * Useful on its own: it answers "what would happen to each of these?" and is
 * what an application-detail view or a compatibility check needs.
 */
export function resolveSelection(applicationIds, environment) {
  return resolveAll(getApplications(applicationIds), environment);
}

/**
 * The full chain: resolve → plan → render.
 *
 * Returns the plan as data *and* the rendered commands, because the client
 * needs both — the steps to review and the exact text to copy. The plan itself
 * never contains command text; see `packages/installer/src/types.ts`.
 */
export function createSetupPlan(applicationIds, environment) {
  const resolutions = resolveSelection(applicationIds, environment);
  const plan = buildPlan(resolutions, environment);
  const rendered = renderPlan(plan);

  return {
    environment,
    /** What was decided for each selected application, and why. */
    resolutions: resolutions.map(presentResolution),
    /** Ordered steps, as data. No command strings at this level. */
    steps: plan.steps,
    /** The commands to copy, in order, each marked privileged or not. */
    commands: rendered.commands,
    /** Applications the user must install themselves, with somewhere to go. */
    manualSteps: rendered.manualSteps,
    /** Applications with no verified route here, stated rather than dropped. */
    unavailable: plan.unavailable.map((entry) => ({
      applicationId: entry.application.id,
      applicationName: entry.application.name,
      reason: entry.reason,
      explanation: entry.explanation,
    })),
    summary: {
      selected: applicationIds.length,
      installable: resolutions.filter((r) => r.outcome === "resolved").length,
      manual: resolutions.filter((r) => r.outcome === "manual").length,
      unavailable: resolutions.filter((r) => r.outcome === "unavailable").length,
      privilegedCommands: rendered.privilegedCount,
      /** Always false. Stated explicitly so no client has to infer it. */
      executed: false,
    },
  };
}
