/**
 * Client for the ConfigShell planning API.
 *
 * ## What goes over the network, and what does not
 *
 * **Browsing is local.** The catalog is compiled into this bundle from
 * `@configshell/catalog`, so search, filtering, categories and role presets work
 * with no server at all. That is the existing architecture and it is also the
 * safer one: there is no catalog-fetch path to intercept or poison.
 *
 * **Planning is remote.** Resolution, ordering and command generation happen in
 * `packages/installer`, reached through `POST /api/plan`. The alternative —
 * importing the installer into the browser — would work, but it would put the
 * one security-critical function in the bundle and give two consumers two
 * places to drift apart. One implementation, one answer.
 *
 * The consequence is honest and visible rather than hidden: without the API,
 * you can browse and select but not generate a plan, and the UI says exactly
 * that instead of silently degrading.
 *
 * Requests carry **catalog ids and a distribution name, and nothing else.** No
 * package name, command, flag or URL is ever sent — no such field exists.
 */

import type { Distro, InstallMethod, RepositoryOrigin } from '@configshell/catalog';

/** Same base path in dev (Vite proxies it) and in production (same origin). */
const API_BASE = '/api';

/** Long enough for a cold start, short enough that a dead server is obvious. */
const REQUEST_TIMEOUT_MS = 10_000;

// ----------------------------------------------------------------- responses

export interface PlanCommand {
  command: string;
  privileged: boolean;
  summary: string;
  stepKind: 'refresh-metadata' | 'install' | 'verify' | 'manual';
  /** A precondition for this specific command, e.g. the Flathub remote. */
  note?: string;
}

export interface PlanManualStep {
  applicationId: string;
  applicationName: string;
  reason: 'repository-setup-required' | 'official-download-only';
  url?: string;
  summary: string;
}

export interface PlanUnavailable {
  applicationId: string;
  applicationName: string;
  reason: 'no-source-for-environment' | 'no-verified-source';
  explanation: string;
}

export interface ConsideredSource {
  method: InstallMethod;
  identifier: string;
  origin: RepositoryOrigin;
  /** Whether this source could be used for the requested environment. */
  eligible: boolean;
  /** Why it was chosen or excluded, in words safe to show a user. */
  note: string;
}

export interface PlanResolution {
  applicationId: string;
  applicationName: string;
  outcome: 'resolved' | 'manual' | 'unavailable';
  source?: { method: InstallMethod; identifier: string; origin: RepositoryOrigin };
  reason: string;
  explanation?: string;
  url?: string;
  considered: ConsideredSource[];
}

export interface PlanStep {
  kind: 'refresh-metadata' | 'install' | 'manual' | 'verify';
  privileged: boolean;
  summary: string;
  note?: string;
  method?: InstallMethod;
  identifiers?: string[];
  applicationIds?: string[];
  binaries?: string[];
  applicationId?: string;
  applicationName?: string;
  url?: string;
  reason?: string;
}

export interface SetupPlan {
  environment: { os: string; distro: Distro; ecosystem: string; architecture?: string };
  /**
   * Whether every selected application resolved to a command.
   *
   * `partial` is a normal outcome, not an error: a selection can mix things
   * that install with a command and things the user has to fetch themselves.
   */
  status: 'complete' | 'partial' | 'none';
  resolutions: PlanResolution[];
  steps: PlanStep[];
  commands: PlanCommand[];
  manualSteps: PlanManualStep[];
  unavailable: PlanUnavailable[];
  summary: {
    selected: number;
    installable: number;
    manual: number;
    unavailable: number;
    privilegedCommands: number;
  };
  /** Always `executed: false`. ConfigShell plans; it never runs anything. */
  execution: { executed: boolean; executedBy: null; note: string };
}

// -------------------------------------------------------------------- errors

/**
 * A failed request, in a shape the UI can act on.
 *
 * `kind` separates the three cases that need genuinely different messages:
 * the server is not reachable at all, the server refused this request, or the
 * server broke. Telling a user "unknown application" when the real problem is
 * that nothing is listening on port 3000 is the kind of small dishonesty that
 * wastes an afternoon.
 */
export class ApiRequestError extends Error {
  constructor(
    readonly kind: 'offline' | 'rejected' | 'server' | 'malformed',
    message: string,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }

  /** Is retrying the same request worth offering? */
  get retryable(): boolean {
    return this.kind === 'offline' || this.kind === 'server';
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
  } catch (cause) {
    // fetch() rejects for network failure and for our own abort. Neither means
    // the request was understood and refused.
    const aborted = cause instanceof DOMException && cause.name === 'AbortError';
    throw new ApiRequestError(
      'offline',
      aborted
        ? 'The ConfigShell API did not respond in time.'
        : 'Could not reach the ConfigShell API.',
    );
  } finally {
    clearTimeout(timeout);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // A 5xx with an unreadable body is almost always a dev proxy reporting that
    // nothing is listening upstream, not the API misbehaving. Calling that
    // "malformed response" sends the reader looking in the wrong place, so it
    // is classified as offline — which is also the retryable, actionable one.
    if (response.status >= 500) {
      throw new ApiRequestError(
        'offline',
        'Could not reach the ConfigShell API — it returned no usable response.',
      );
    }
    throw new ApiRequestError(
      'malformed',
      `The API returned a response this app could not read (HTTP ${response.status}).`,
    );
  }

  if (!response.ok) {
    const envelope = body as ErrorEnvelope;
    throw new ApiRequestError(
      response.status >= 500 ? 'server' : 'rejected',
      envelope.error?.message ?? `The API rejected this request (HTTP ${response.status}).`,
      envelope.error?.code,
      envelope.error?.details,
    );
  }

  const data = (body as { data?: T }).data;
  if (data === undefined) {
    throw new ApiRequestError('malformed', 'The API returned an unexpected response shape.');
  }
  return data;
}

// ------------------------------------------------------------------ requests

/**
 * Generate a setup plan.
 *
 * Sends only `applicationIds` and `{ distro }`. Everything in the response —
 * which source, in what order, with what privileges, and the command text — is
 * decided server-side by `packages/installer`.
 */
export function createPlan(applicationIds: string[], distro: Distro): Promise<SetupPlan> {
  return request<SetupPlan>('/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ environment: { distro }, applicationIds }),
  });
}

/**
 * How one application resolves for one distribution.
 *
 * Wraps `GET /api/applications/:id?distro=…`. The UI uses this instead of
 * working applicability out for itself — see `useApplicationResolution`.
 */
export async function fetchApplicationResolution(
  applicationId: string,
  distro: Distro,
): Promise<PlanResolution> {
  const data = await request<{ application: unknown; resolution?: PlanResolution }>(
    `/applications/${encodeURIComponent(applicationId)}?distro=${encodeURIComponent(distro)}`,
  );
  if (!data.resolution) {
    throw new ApiRequestError('malformed', 'The API returned no resolution for this application.');
  }
  return data.resolution;
}

export interface ApiHealth {
  status: 'ok' | 'degraded';
  catalog: { valid: boolean; errorCount: number };
  capabilities: { plansInstallations: boolean; executesCommands: boolean };
}

/** Used to tell "API is down" from "this request was bad" before planning. */
export function checkHealth(): Promise<ApiHealth> {
  return request<ApiHealth>('/health');
}
