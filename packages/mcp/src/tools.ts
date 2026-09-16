/**
 * The ConfigShell MCP tool surface.
 *
 * Every tool is a **thin adapter over `@configshell/catalog` and
 * `@configshell/installer`**. No business logic lives here: resolution, plan
 * ordering, privilege marking and command generation are all decided by the
 * same pure functions the web app and the API server use, so an MCP client
 * cannot get a different answer from anyone else.
 *
 * ## The boundary, stated once
 *
 * These tools are **read-only and deterministic**. They plan and validate.
 * Nothing here executes a command, touches the filesystem, opens a socket, or
 * inspects the machine this process runs on.
 *
 * ## What this layer is for
 *
 * An external MCP host — Claude, ChatGPT, Cursor, VS Code, anything that speaks
 * the protocol — connects and uses these tools to help a user discover, compare
 * and choose software, then build a setup plan. **The host does the reasoning
 * and the conversation; ConfigShell supplies trusted data and deterministic
 * operations.** There is no model in this repository and none is required.
 *
 * Three capabilities from the design sketch are deliberately **absent** rather
 * than stubbed, because they require the local agent that does not exist
 * (docs/agent.md):
 *
 * - `detect_system` — real distribution/architecture/desktop detection. A
 *   server process cannot honestly report the *user's* machine, and guessing
 *   would be worse than asking. `list_environments` exists instead: it says
 *   what ConfigShell supports, and the caller supplies the environment.
 * - `check_installed` — whether a package is already present. Requires reading
 *   the user's package database.
 * - `execute_setup` — running anything at all. This is the agent's entire
 *   reason to exist, with local re-validation and per-step confirmation.
 *
 * They are not registered as tools. A tool that always fails is still a tool a
 * caller has to discover and handle, and a tool that returns a plausible guess
 * would be a lie.
 */

import {
  APPLICATIONS,
  ARCHITECTURES,
  CATEGORIES,
  DISTROS,
  ECOSYSTEM_DISTROS,
  OPERATING_SYSTEMS,
  PACKAGE_ECOSYSTEMS,
  ROLES,
  applicationsForRole,
  ecosystemForDistro,
  findApplication,
  findRole,
  searchApplications,
  APPLICATION_ID_PATTERN,
  MAX_APPLICATION_ID_LENGTH,
  type Application,
  type Category,
  type Environment,
} from '@configshell/catalog';
import { buildPlan, renderPlan, resolveAll, type Resolution } from '@configshell/installer';
import { z } from 'zod';
import { ToolError } from './errors.ts';
import {
  applicationsFor,
  asObject,
  parseApplicationIds,
  parseEnvironmentArgument,
} from './validate.ts';

/**
 * A tool, described once and consumed by the SDK.
 *
 * `inputSchema` is a Zod object rather than hand-written JSON Schema: the SDK
 * derives the JSON Schema that clients see, and validates arguments against it
 * before a handler runs. That gives every MCP host an accurate, machine-readable
 * contract without a second copy of the shape maintained by hand.
 *
 * Zod checks *shape*. `validate.ts` still checks the business rules that a
 * schema cannot express — that an id exists in the catalog, that a selection is
 * deduplicated — so the two are complementary rather than redundant.
 */
export interface ToolDefinition {
  name: string;
  /** Short human label for client UIs. */
  title: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  /**
   * Behavioural hints, read by hosts to decide what needs confirmation.
   *
   * Every ConfigShell tool is `readOnlyHint: true` and `openWorldHint: false`:
   * nothing changes state, and every answer comes from the compiled-in catalog
   * rather than the open internet. That is the security posture, declared in the
   * protocol's own vocabulary instead of only in prose a host will not read.
   */
  annotations: {
    readOnlyHint: true;
    destructiveHint: false;
    idempotentHint: true;
    openWorldHint: false;
  };
  /** Handlers are synchronous: every one is a pure function over the catalog. */
  handler: (args: unknown) => unknown;
}

/** Shared by every tool here — see `ToolDefinition.annotations`. */
const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

// ------------------------------------------------------------ shared schemas

/**
 * `.strict()` throughout: an unrecognised argument is rejected rather than
 * ignored. A host that invents a `command` or `packages` field gets a clear
 * schema error instead of a silently-dropped field and a plan that does not
 * match what it thought it asked for.
 */
const ENVIRONMENT_SCHEMA = z
  .object({
    distro: z
      .enum(DISTROS as unknown as [string, ...string[]])
      .describe(
        'The Linux distribution. Required. The package ecosystem (apt/dnf/pacman) is ' +
          'derived from this and must not be supplied.',
      ),
    architecture: z
      .enum(ARCHITECTURES as unknown as [string, ...string[]])
      .optional()
      .describe('Optional, recorded only. No catalog data is architecture-specific yet.'),
  })
  .strict()
  .describe(
    'The target environment. Always supplied by the caller — ConfigShell cannot detect ' +
      "the user's machine. Call list_environments and ask the user.",
  );

/**
 * A catalog id, with its shape declared rather than checked by hand.
 *
 * The SDK enforces this before a handler runs *and* publishes it in the JSON
 * Schema every client reads, so a host can see what a valid id looks like
 * instead of discovering it from an error. The pattern comes from
 * `@configshell/catalog`, which is where that rule lives.
 */
const APPLICATION_ID_SCHEMA = z
  .string()
  .min(1)
  .max(MAX_APPLICATION_ID_LENGTH)
  .regex(APPLICATION_ID_PATTERN, 'must be a lowercase slug, such as "vscode"');

/** Bounds work per call. The catalog holds 31 entries, so this constrains nobody. */
const MAX_SELECTION = 200;

const APPLICATION_IDS_SCHEMA = z
  .array(APPLICATION_ID_SCHEMA)
  .min(1)
  .max(MAX_SELECTION)
  .describe(
    'Catalog ids, e.g. ["git","vscode"]. Get them from search_application. An id that is ' +
      'not in the catalog refuses the whole call rather than being skipped, so the plan ' +
      'always matches what was asked for.',
  );

// ------------------------------------------------------------------ shaping

/** Flatten an application for the wire. */
function shapeApplication(application: Application) {
  return {
    id: application.id,
    name: application.name,
    description: application.description,
    category: application.category,
    homepage: application.homepage,
    installation: application.installation.map((source) => ({
      method: source.method,
      identifier: source.identifier,
      origin: source.origin,
      ...(source.distros ? { distros: [...source.distros] } : {}),
      ...(source.url ? { url: source.url } : {}),
    })),
    ...(application.verify ? { verify: { binary: application.verify.binary } } : {}),
  };
}

/**
 * Flatten a resolution, including `considered`.
 *
 * The rejected sources are part of the answer, not debug output: "which source
 * did you pick and why, and what did you turn down" is what makes the choice
 * auditable by whoever is reading the result.
 */
function shapeResolution(resolution: Resolution) {
  const base = {
    applicationId: resolution.application.id,
    applicationName: resolution.application.name,
    outcome: resolution.outcome,
    considered: resolution.considered.map((candidate) => ({
      method: candidate.source.method,
      identifier: candidate.source.identifier,
      origin: candidate.source.origin,
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

/** Resolve → plan → render, in one place so every tool agrees. */
function planFor(ids: readonly string[], environment: Environment) {
  const resolutions = resolveAll(applicationsFor(ids), environment);
  const plan = buildPlan(resolutions, environment);
  return { resolutions, plan, rendered: renderPlan(plan) };
}

// -------------------------------------------------------------------- tools

const listEnvironments: ToolDefinition = {
  name: 'list_environments',
  description:
    'List the environments ConfigShell supports, with the package ecosystem each ' +
    'distribution uses. Call this before anything that takes an environment.\n\n' +
    'This is NOT system detection. ConfigShell cannot detect the user\'s distribution: ' +
    'a browser cannot do it honestly and a server process is not on the user\'s machine. ' +
    'Real detection is a local-agent capability that does not exist yet, so the caller ' +
    'must supply the environment — asking the user is the correct behaviour.',
  title: 'List supported environments',
  inputSchema: z.object({}).strict(),
  annotations: READ_ONLY,
  handler: () => ({
    detectionAvailable: false,
    detectionNote:
      'ConfigShell does not detect the environment. Ask the user which distribution they ' +
      'are running rather than guessing.',
    operatingSystems: [...OPERATING_SYSTEMS],
    distros: DISTROS.map((distro) => ({ distro, ecosystem: ecosystemForDistro(distro) })),
    ecosystems: PACKAGE_ECOSYSTEMS.map((ecosystem) => ({
      ecosystem,
      distros: [...ECOSYSTEM_DISTROS[ecosystem]],
    })),
    architectures: [...ARCHITECTURES],
    architectureAffectsResolution: false,
  }),
};

const searchApplication: ToolDefinition = {
  name: 'search_application',
  description:
    'Search the trusted catalog by free text and/or category. Matches id, name, ' +
    'description and category. Returns catalog entries only — no installation commands.',
  title: 'Search applications',
  inputSchema: z
    .object({
      query: z
        .string()
        .max(100)
        .optional()
        .describe('Free text matched against id, name, description and category. Omit to list everything.'),
      category: z
        .enum(CATEGORIES as unknown as [string, ...string[]])
        .optional()
        .describe('Exact category filter, applied in addition to query.'),
    })
    .strict(),
  annotations: READ_ONLY,
  handler: (args) => {
    const input = asObject(args);
    const results = searchApplications({
      query: input.query as string | undefined,
      category: input.category as Category | undefined,
    });
    return {
      total: results.length,
      catalogSize: APPLICATIONS.length,
      applications: results.map(shapeApplication),
    };
  },
};

const getApplication: ToolDefinition = {
  name: 'get_application',
  description:
    'One catalog entry by id, including every verified installation source and who ' +
    'packages it (distro / vendor / community). Supply an environment to also get the ' +
    'resolution for it: which source would be used, why, and what was rejected.',
  title: 'Get application details',
  inputSchema: z
    .object({
      applicationId: APPLICATION_ID_SCHEMA.describe('Catalog id, e.g. "vscode".'),
      environment: ENVIRONMENT_SCHEMA.optional(),
    })
    .strict(),
  annotations: READ_ONLY,
  handler: (args) => {
    const input = asObject(args);
    const id = input.applicationId as string;

    const application = findApplication(id);
    if (!application) {
      throw ToolError.notFound(`No application with id "${id}".`);
    }

    if (input.environment === undefined) {
      return { application: shapeApplication(application) };
    }

    const environment = parseEnvironmentArgument(input.environment);
    const [resolution] = resolveAll([application], environment);
    return {
      application: shapeApplication(application),
      environment,
      resolution: shapeResolution(resolution!),
    };
  },
};

const listRoles: ToolDefinition = {
  name: 'list_roles',
  description:
    'List the deterministic role/use-case presets. A preset is a curated list of catalog ' +
    'ids — a fixed, reviewable set, not a recommendation engine. No model is involved.',
  title: 'List role presets',
  inputSchema: z
    .object({
      roleId: APPLICATION_ID_SCHEMA.optional().describe(
        'Optional. Return just this preset, with full application details.',
      ),
    })
    .strict(),
  annotations: READ_ONLY,
  handler: (args) => {
    const input = asObject(args);

    if (input.roleId !== undefined) {
      const id = input.roleId as string;
      const role = findRole(id);
      if (!role) throw ToolError.notFound(`No role with id "${id}".`);
      return {
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          recommended: applicationsForRole(role, 'recommended').map(shapeApplication),
          optional: applicationsForRole(role, 'optional').map(shapeApplication),
        },
      };
    }

    return {
      roles: ROLES.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        recommended: [...role.recommended],
        optional: [...role.optional],
      })),
    };
  },
};

const checkCompatibility: ToolDefinition = {
  name: 'check_compatibility',
  description:
    'Resolve a selection against an environment without building a plan: for each ' +
    'application, whether it is installable there, needs a manual step, or has no ' +
    'verified route — with the reason and the sources that were rejected.\n\n' +
    'This answers "will this work on this distribution", not "is it already installed" ' +
    '— ConfigShell cannot see the user\'s machine.',
  title: 'Check compatibility',
  inputSchema: z
    .object({ applicationIds: APPLICATION_IDS_SCHEMA, environment: ENVIRONMENT_SCHEMA })
    .strict(),
  annotations: READ_ONLY,
  handler: (args) => {
    const input = asObject(args);
    const ids = parseApplicationIds(input.applicationIds);
    const environment = parseEnvironmentArgument(input.environment);

    const resolutions = resolveAll(applicationsFor(ids), environment);
    return {
      environment,
      resolutions: resolutions.map(shapeResolution),
      summary: {
        installable: resolutions.filter((r) => r.outcome === 'resolved').length,
        manual: resolutions.filter((r) => r.outcome === 'manual').length,
        unavailable: resolutions.filter((r) => r.outcome === 'unavailable').length,
      },
    };
  },
};

const generateSetup: ToolDefinition = {
  name: 'generate_setup',
  description:
    'Build an ordered setup plan for a selection and an environment, with the exact ' +
    'commands the USER would run in their own terminal.\n\n' +
    'This produces a PROPOSAL. Nothing is executed, here or anywhere else in ConfigShell. ' +
    'Present the commands to the user in full — privileged ones are flagged — and let ' +
    'them decide. Applications that need a vendor repository, or that ship only as a ' +
    'vendor download, come back as manual steps with a link rather than as a command that ' +
    'would fail.',
  title: 'Generate setup plan',
  inputSchema: z
    .object({ applicationIds: APPLICATION_IDS_SCHEMA, environment: ENVIRONMENT_SCHEMA })
    .strict(),
  annotations: READ_ONLY,
  handler: (args) => {
    const input = asObject(args);
    const ids = parseApplicationIds(input.applicationIds);
    const environment = parseEnvironmentArgument(input.environment);

    const { resolutions, plan, rendered } = planFor(ids, environment);

    return {
      environment,
      resolutions: resolutions.map(shapeResolution),
      steps: plan.steps,
      commands: rendered.commands.map((command) => ({
        command: command.command,
        privileged: command.privileged,
        summary: command.summary,
        stepKind: command.stepKind,
        ...(command.note ? { note: command.note } : {}),
      })),
      manualSteps: rendered.manualSteps.map((step) => ({
        applicationId: step.applicationId,
        applicationName: step.applicationName,
        reason: step.reason,
        summary: step.summary,
        ...(step.url ? { url: step.url } : {}),
      })),
      unavailable: plan.unavailable.map((entry) => ({
        applicationId: entry.application.id,
        applicationName: entry.application.name,
        reason: entry.reason,
        explanation: entry.explanation,
      })),
      summary: {
        selected: ids.length,
        installable: resolutions.filter((r) => r.outcome === 'resolved').length,
        manual: resolutions.filter((r) => r.outcome === 'manual').length,
        unavailable: resolutions.filter((r) => r.outcome === 'unavailable').length,
        privilegedCommands: rendered.privilegedCount,
      },
      execution: {
        executed: false,
        executedBy: null,
        note:
          'ConfigShell never runs these. Installing is the user\'s own act in their own ' +
          'terminal. Automated execution would belong to the local agent, which does not ' +
          'exist.',
      },
    };
  },
};

const validateSetup: ToolDefinition = {
  name: 'validate_setup',
  description:
    'Check a set of commands against what ConfigShell would generate for the same ' +
    'selection and environment.\n\n' +
    'Use this to confirm that commands which have passed through another system are still ' +
    'exactly what the trusted catalog produces — if anything was altered, added or ' +
    'dropped, this reports it. The submitted commands are compared only; they are never ' +
    'executed and never echoed back as approved.\n\n' +
    'A pass here is NOT an authorisation to run anything. Whatever eventually executes ' +
    'must re-validate against the catalog itself and ask the user.',
  title: 'Validate a setup plan',
  inputSchema: z
    .object({
      applicationIds: APPLICATION_IDS_SCHEMA,
      environment: ENVIRONMENT_SCHEMA,
      commands: z
        .array(z.string().max(4096))
        .max(500)
        .describe(
          'The commands to check, in order. Compared against catalog-derived output; ' +
            'never executed, never returned as approved.',
        ),
    })
    .strict(),
  annotations: READ_ONLY,
  handler: (args) => {
    const input = asObject(args);
    const ids = parseApplicationIds(input.applicationIds);
    const environment = parseEnvironmentArgument(input.environment);
    const submitted = input.commands as string[];

    const { rendered } = planFor(ids, environment);
    const expected = rendered.commands.map((command) => command.command);

    const expectedSet = new Set(expected);
    const submittedSet = new Set(submitted);

    const unexpected = submitted.filter((command) => !expectedSet.has(command));
    const missing = expected.filter((command) => !submittedSet.has(command));
    const orderMatches =
      submitted.length === expected.length &&
      submitted.every((command, index) => command === expected[index]);

    const valid = unexpected.length === 0 && missing.length === 0 && orderMatches;

    return {
      valid,
      environment,
      expectedCommands: expected,
      // Truncated: an error path should not reflect an arbitrary payload back
      // at full size.
      unexpectedCommands: unexpected.slice(0, 20),
      missingCommands: missing,
      orderMatches,
      checks: {
        everyCommandDerivedFromCatalog: unexpected.length === 0,
        nothingOmitted: missing.length === 0,
        orderPreserved: orderMatches,
      },
      note: valid
        ? 'These are exactly the commands ConfigShell generates for this selection. That ' +
          'is not an authorisation to run them: whatever executes must re-validate and ask ' +
          'the user.'
        : 'These commands do NOT match what ConfigShell generates. Do not run them. ' +
          'Regenerate the plan with generate_setup.',
    };
  },
};

/**
 * The registered tools, in the order they are advertised.
 *
 * Adding one is a security review, not a chore: the rule from docs/mcp.md is
 * that a client can do something only because a tool for it exists, was
 * reviewed, and was authorized.
 */
export const TOOLS: readonly ToolDefinition[] = [
  listEnvironments,
  searchApplication,
  getApplication,
  listRoles,
  checkCompatibility,
  generateSetup,
  validateSetup,
];

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.name === name);
}

/**
 * Capabilities that exist in the design but are deliberately not tools, with
 * the reason. Exported so documentation and tests can assert the boundary
 * rather than restate it.
 */
export const WITHHELD_CAPABILITIES = [
  {
    name: 'detect_system',
    reason:
      'Requires reading the user\'s machine. Not possible from a browser or a server ' +
      'process; a local-agent capability. Use list_environments and ask the user.',
  },
  {
    name: 'check_installed',
    reason:
      'Requires reading the user\'s package database. A local-agent capability.',
  },
  {
    name: 'execute_setup',
    reason:
      'Execution is the local agent\'s entire purpose, with local re-validation and ' +
      'per-step user confirmation. No MCP tool may run a command.',
  },
] as const;
