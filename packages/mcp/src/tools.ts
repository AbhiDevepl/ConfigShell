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
  createEnvironment,
  ecosystemForDistro,
  findApplication,
  findRole,
  searchApplications,
  APPLICATION_ID_PATTERN,
  MAX_APPLICATION_ID_LENGTH,
  type Application,
  type Architecture,
  type Category,
  type Distro,
  type Environment,
} from '@configshell/catalog';
import {
  buildPlan,
  catalogCoverage,
  presentResolution,
  presentSetupPlan,
  renderPlan,
  resolveAll,
} from '@configshell/installer';
import { z } from 'zod';
import { ToolError } from './errors.ts';
import {
  applicationsFor,
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
  /**
   * Handlers are synchronous: every one is a pure function over the catalog.
   *
   * Typed loosely here because one array holds seven differently-shaped tools.
   * `defineTool` gives each handler its own schema-derived argument type at the
   * point it is written, which is where the type is worth having.
   */
  handler: (args: Record<string, unknown>) => unknown;
}

/**
 * Define a tool, typing its handler against its own schema.
 *
 * Without this the handler would take `unknown`, and every one would re-narrow
 * arguments the SDK had already parsed and typed — an object narrow plus a cast
 * per field, in each of seven tools. Here inference does it once.
 *
 * The single cast below is where the per-tool type is erased so heterogeneous
 * tools can share one `TOOLS` array. One erasure, in one place, instead of
 * rebuilding the types by hand at every call site.
 */
function defineTool<Schema extends z.ZodObject<z.ZodRawShape>>(tool: {
  name: string;
  title: string;
  description: string;
  inputSchema: Schema;
  annotations: ToolDefinition['annotations'];
  handler: (args: z.infer<Schema>) => unknown;
}): ToolDefinition {
  return tool as unknown as ToolDefinition;
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
      .enum([...DISTROS] as [Distro, ...Distro[]])
      .describe(
        'The Linux distribution. Required. The package ecosystem (apt/dnf/pacman) is ' +
          'derived from this and must not be supplied.',
      ),
    architecture: z
      .enum([...ARCHITECTURES] as [Architecture, ...Architecture[]])
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
 * Resolve → plan → render, for `validate_setup`'s comparison only.
 *
 * `generate_setup` does not use this: it returns `presentSetupPlan`, the same
 * canonical plan the HTTP API returns. This exists because validation needs the
 * expected command strings and nothing else.
 */
function commandsFor(ids: readonly string[], environment: Environment): readonly string[] {
  const applications = applicationsFor(ids);
  const plan = buildPlan(resolveAll(applications, environment), environment);
  return renderPlan(plan).commands.map((command) => command.command);
}

// -------------------------------------------------------------------- tools

const listEnvironments = defineTool({
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
    // `coverage` is the same resolver-derived count `GET /api/catalog/environments`
    // returns, and it is here for the same reason: a supported distribution is
    // not the same as a well-covered one. openSUSE is supported end to end, but
    // no catalog entry carries a zypper identifier yet, so every application
    // there resolves to Flatpak/Snap or to nothing. A host that cannot see that
    // will pick a distribution for a user and then explain an empty plan.
    // Derived from `resolveAll`, never stored, so it cannot drift from what
    // generate_setup would actually produce.
    distros: DISTROS.map((distro) => ({
      distro,
      ecosystem: ecosystemForDistro(distro),
      coverage: catalogCoverage(createEnvironment(distro)),
    })),
    ecosystems: PACKAGE_ECOSYSTEMS.map((ecosystem) => ({
      ecosystem,
      distros: [...ECOSYSTEM_DISTROS[ecosystem]],
    })),
    architectures: [...ARCHITECTURES],
    architectureAffectsResolution: false,
  }),
});

const searchApplication = defineTool({
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
        .enum([...CATEGORIES] as [Category, ...Category[]])
        .optional()
        .describe('Exact category filter, applied in addition to query.'),
    })
    .strict(),
  annotations: READ_ONLY,
  handler: ({ query, category }) => {
    const results = searchApplications({ query, category });
    return {
      total: results.length,
      catalogSize: APPLICATIONS.length,
      applications: results.map(shapeApplication),
    };
  },
});

const getApplication = defineTool({
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
  handler: ({ applicationId, environment: requested }) => {
    const application = findApplication(applicationId);
    if (!application) {
      throw ToolError.notFound(`No application with id "${applicationId}".`);
    }

    if (requested === undefined) {
      return { application: shapeApplication(application) };
    }

    const environment = parseEnvironmentArgument(requested);
    const [resolution] = resolveAll([application], environment);
    return {
      application: shapeApplication(application),
      environment,
      resolution: presentResolution(resolution!),
    };
  },
});

const listRoles = defineTool({
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
  handler: ({ roleId }) => {
    if (roleId !== undefined) {
      const role = findRole(roleId);
      if (!role) throw ToolError.notFound(`No role with id "${roleId}".`);
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
});

const checkCompatibility = defineTool({
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
  handler: ({ applicationIds, environment: requested }) => {
    const ids = parseApplicationIds(applicationIds);
    const environment = parseEnvironmentArgument(requested);

    const resolutions = resolveAll(applicationsFor(ids), environment);
    return {
      environment,
      resolutions: resolutions.map(presentResolution),
      summary: {
        installable: resolutions.filter((r) => r.outcome === 'resolved').length,
        manual: resolutions.filter((r) => r.outcome === 'manual').length,
        unavailable: resolutions.filter((r) => r.outcome === 'unavailable').length,
      },
    };
  },
});

const generateSetup = defineTool({
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
  handler: ({ applicationIds, environment: requested }) => {
    const ids = parseApplicationIds(applicationIds);
    const environment = parseEnvironmentArgument(requested);

    return presentSetupPlan(applicationsFor(ids), environment);
  },
});

const validateSetup = defineTool({
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
  handler: ({ applicationIds, environment: requested, commands: submitted }) => {
    const ids = parseApplicationIds(applicationIds);
    const environment = parseEnvironmentArgument(requested);

    const expected = commandsFor(ids, environment);

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
});

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
