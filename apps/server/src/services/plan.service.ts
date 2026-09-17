/**
 * Setup-plan generation.
 *
 * A thin adapter over `@configshell/installer`. Every decision — which source,
 * in what order, with what privileges, what the command is, and what the
 * response looks like — is made by that package. This module resolves catalog
 * ids to applications and calls it.
 *
 * The plan shape itself is `presentSetupPlan`'s, not this module's, so the HTTP
 * response and the MCP tool result are the same object built by the same code
 * rather than two shapes a test has to keep in agreement.
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

import { presentSetupPlan, resolveAll } from "@configshell/installer";
import type { Environment } from "@configshell/catalog";
import { getApplications } from "./catalog.service.js";

/**
 * Resolve a selection against an environment, without planning.
 *
 * Useful on its own: it answers "what would happen to each of these?" and is
 * what an application-detail view or a compatibility check needs.
 */
export function resolveSelection(applicationIds: string[], environment: Environment) {
  return resolveAll(getApplications(applicationIds), environment);
}

/**
 * The canonical setup plan for a selection.
 *
 * `getApplications` refuses an unknown id — which is this adapter's job, since
 * an HTTP refusal looks different from an MCP one. Everything after that is the
 * installer's.
 */
export function createSetupPlan(applicationIds: string[], environment: Environment) {
  return presentSetupPlan(getApplications(applicationIds), environment);
}
