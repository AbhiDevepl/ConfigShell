/**
 * Public API of the deterministic core.
 *
 * `(catalog, environment)` in, a reviewable setup plan and a set of commands
 * out — with no I/O, no execution, and no dependency on any UI. That shape is
 * what lets the web app, the API server, and later a CLI or MCP server all
 * reuse exactly this logic instead of reimplementing it.
 *
 * **This package never changes a system.** Running the generated commands is
 * the user's own deliberate act, in their own terminal. Executing them on the
 * user's behalf would belong to the local agent, which does not exist — see
 * docs/agent.md.
 */

export { resolve, resolveAll } from './resolve.ts';
export { buildPlan } from './plan.ts';
export { catalogCoverage, type CatalogCoverage } from './coverage.ts';
export { renderPlan, UnsafeIdentifierError, safeBinary, safeIdentifier } from './commands.ts';
export {
  exclusionNote,
  isNativeEcosystemMethod,
  isPrivilegedMethod,
  rankSource,
  requiresRepositorySetup,
} from './policy.ts';

export type {
  ConsideredSource,
  InstallStep,
  ManualInstall,
  ManualStep,
  PlanStep,
  RefreshStep,
  RenderedCommand,
  RenderedPlan,
  Resolution,
  ResolvedInstall,
  SetupPlan,
  UnavailableInstall,
  UnresolvedReason,
  VerifyStep,
} from './types.ts';
