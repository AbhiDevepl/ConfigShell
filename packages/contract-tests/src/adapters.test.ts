/**
 * Cross-adapter contract: HTTP and MCP must answer the same question the same way.
 *
 * ConfigShell exposes one core through two adapters. They do **not** call each
 * other — MCP does not go over HTTP — so nothing at the transport level forces
 * them to agree.
 *
 * Both now build their plan with `presentSetupPlan` from
 * `@configshell/installer`, so agreement is structural rather than maintained
 * by hand. These tests exist to keep it that way: each adapter used to shape
 * the plan itself, the two drifted (`summary.executed` on one side, a richer
 * `execution` block on the other, and manual steps that leaked internal step
 * fields over HTTP only), and the tests here compared the fields both happened
 * to share — so neither difference failed anything.
 *
 * The plan test below therefore compares the **whole object**, not a chosen
 * subset. A field that appears on one adapter's plan and not the other's fails
 * it, which is the only assertion that would have caught the original drift.
 *
 * Both adapters are exercised in-process — the real Express app on an ephemeral
 * port, the real MCP tool handlers — so this is the actual code paths, not a
 * reimplementation of them.
 */

import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import { APPLICATIONS, DISTROS, type Distro } from '@configshell/catalog';
import { findTool } from '@configshell/mcp';
import { createApp } from 'server/app';

let server: Server;
let baseUrl: string;

before(async () => {
  process.env.NODE_ENV = 'test';
  // No built web app: this is an API contract test, not a serving test.
  server = createApp({ webDist: null }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => new Promise((resolve) => server.close(() => resolve(undefined))));

async function http(path: string, body?: unknown): Promise<any> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...(body === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
  const json = (await response.json()) as any;
  return { status: response.status, data: json.data, error: json.error };
}

function mcp(name: string, args: unknown): any {
  const tool = findTool(name);
  assert.ok(tool, `no MCP tool named ${name}`);
  // Through the declared schema, the way the SDK invokes it.
  return tool.handler(tool.inputSchema.parse(args) as Record<string, unknown>);
}

// --------------------------------------------------------- catalog identity

test('both adapters serve the same catalog', async () => {
  const viaHttp = await http('/api/applications');
  const viaMcp = mcp('search_application', {});

  assert.equal(viaHttp.data.total, viaMcp.total);
  assert.equal(viaHttp.data.total, APPLICATIONS.length);
  assert.deepEqual(
    viaHttp.data.applications.map((a: any) => a.id),
    viaMcp.applications.map((a: any) => a.id),
    'application ordering or membership differs between adapters',
  );
});

test('search returns the same results through both adapters', async () => {
  for (const query of ['git', 'vscode', 'browser', 'zzz-no-match']) {
    const viaHttp = await http(`/api/applications?query=${encodeURIComponent(query)}`);
    const viaMcp = mcp('search_application', { query });
    assert.deepEqual(
      viaHttp.data.applications.map((a: any) => a.id),
      viaMcp.applications.map((a: any) => a.id),
      `search "${query}" differs`,
    );
  }
});

test('category filtering agrees', async () => {
  const viaHttp = await http('/api/applications?category=Browsers');
  const viaMcp = mcp('search_application', { category: 'Browsers' });
  assert.deepEqual(
    viaHttp.data.applications.map((a: any) => a.id),
    viaMcp.applications.map((a: any) => a.id),
  );
});

test('role presets agree', async () => {
  const viaHttp = await http('/api/catalog/roles');
  const viaMcp = mcp('list_roles', {});
  assert.deepEqual(
    viaHttp.data.roles.map((r: any) => r.id),
    viaMcp.roles.map((r: any) => r.id),
  );
  for (const role of viaHttp.data.roles) {
    const mcpRole = viaMcp.roles.find((r: any) => r.id === role.id);
    assert.deepEqual(role.recommended, mcpRole.recommended, `${role.id} recommended differs`);
  }
});

// ------------------------------------------------------- resolution identity

test('a resolution describes itself identically through both adapters', async () => {
  // The highest-value assertion here: two separately-written flatteners.
  for (const distro of DISTROS) {
    for (const id of ['git', 'vscode', 'cursor', 'firefox']) {
      const viaHttp = await http(`/api/applications/${id}?distro=${encodeURIComponent(distro)}`);
      const viaMcp = mcp('get_application', { applicationId: id, environment: { distro } });

      const h = viaHttp.data.resolution;
      const m = viaMcp.resolution;
      const where = `${id} on ${distro}`;

      assert.equal(h.outcome, m.outcome, `${where}: outcome differs`);
      assert.equal(h.applicationId, m.applicationId, `${where}: id differs`);
      assert.deepEqual(h.source, m.source, `${where}: chosen source differs`);

      // `considered` is the auditable part — which sources were rejected and why.
      assert.deepEqual(
        h.considered.map((c: any) => [c.method, c.identifier, c.eligible, c.note]),
        m.considered.map((c: any) => [c.method, c.identifier, c.eligible, c.note]),
        `${where}: considered sources differ`,
      );
    }
  }
});

// ------------------------------------------------------------ plan identity

test('the same selection produces the same commands through both adapters', async () => {
  const applicationIds = ['git', 'htop', 'firefox', 'cursor'];

  for (const distro of DISTROS) {
    const viaHttp = await http('/api/plan', { environment: { distro }, applicationIds });
    const viaMcp = mcp('generate_setup', { applicationIds, environment: { distro } });

    // The whole plan, field for field. `viaHttp` has been through JSON, so
    // this also asserts the plan survives serialisation unchanged.
    assert.deepEqual(viaHttp.data, viaMcp, `${distro}: setup plans differ`);
  }
});

test('the plan carries an honest status for a partial selection', async () => {
  // `cursor` is a vendor download on every supported distribution; `firefox`
  // resolves on all of them. `git` would not do here — it has no verified
  // zypper identifier, so on openSUSE it is unavailable rather than
  // installable, which is exactly the per-distro difference this asserts.
  for (const distro of DISTROS) {
    const partial = mcp('generate_setup', {
      applicationIds: ['firefox', 'cursor'],
      environment: { distro },
    });
    assert.equal(partial.status, 'partial', `${distro}: mixed selection is a partial plan`);
    assert.equal(partial.summary.selected, 2, distro);
    assert.equal(partial.summary.installable + partial.summary.manual, 2, distro);

    const complete = mcp('generate_setup', {
      applicationIds: ['firefox'],
      environment: { distro },
    });
    assert.equal(complete.status, 'complete', `${distro}: firefox alone is a complete plan`);

    const none = mcp('generate_setup', {
      applicationIds: ['cursor'],
      environment: { distro },
    });
    assert.equal(none.status, 'none', `${distro}: cursor alone yields no commands`);
  }
});

test('neither adapter ever reports having executed anything', async () => {
  const args = { environment: { distro: 'Ubuntu' as Distro }, applicationIds: ['git'] };
  const viaHttp = await http('/api/plan', args);
  const viaMcp = mcp('generate_setup', {
    applicationIds: args.applicationIds,
    environment: args.environment,
  });

  for (const plan of [viaHttp.data, viaMcp]) {
    assert.equal(plan.execution.executed, false);
    assert.equal(plan.execution.executedBy, null);
    assert.equal(plan.commands.length > 0, true, 'a plan with commands still executes nothing');
  }
});

// ------------------------------------------------------- rejection identity

test('both adapters reject an unknown application id', async () => {
  const viaHttp = await http('/api/plan', {
    environment: { distro: 'Ubuntu' },
    applicationIds: ['git', 'not-a-real-app'],
  });
  assert.equal(viaHttp.status, 422);
  assert.equal(viaHttp.error.code, 'UNKNOWN_APPLICATION');

  let mcpError: any;
  try {
    mcp('generate_setup', {
      applicationIds: ['git', 'not-a-real-app'],
      environment: { distro: 'Ubuntu' },
    });
  } catch (cause) {
    mcpError = cause;
  }
  assert.ok(mcpError, 'MCP accepted an unknown application id');
  assert.equal(mcpError.code, 'UNKNOWN_APPLICATION', 'error codes differ between adapters');
});

test('both adapters reject a hostile identifier', async () => {
  const hostile = [
    'evil; rm -rf /',
    'evil && curl example.com',
    '$(whoami)',
    '`whoami`',
    'foo | sh',
    'foo > /tmp/test',
    'foo\nbar',
    '../../../etc/passwd',
  ];

  for (const id of hostile) {
    const viaHttp = await http('/api/plan', {
      environment: { distro: 'Ubuntu' },
      applicationIds: [id],
    });
    assert.ok(
      viaHttp.status === 400 || viaHttp.status === 422,
      `HTTP accepted ${JSON.stringify(id)} with ${viaHttp.status}`,
    );

    let rejected = false;
    try {
      mcp('generate_setup', { applicationIds: [id], environment: { distro: 'Ubuntu' } });
    } catch {
      rejected = true;
    }
    assert.ok(rejected, `MCP accepted ${JSON.stringify(id)}`);
  }
});

test('both adapters reject an unsupported distribution', async () => {
  const viaHttp = await http('/api/plan', {
    environment: { distro: 'Gentoo' },
    applicationIds: ['git'],
  });
  assert.equal(viaHttp.status, 400);
  assert.equal(viaHttp.error.code, 'INVALID_REQUEST');

  let rejected = false;
  try {
    mcp('generate_setup', { applicationIds: ['git'], environment: { distro: 'Gentoo' } });
  } catch {
    rejected = true;
  }
  assert.ok(rejected, 'MCP accepted an unsupported distribution');
});

// ------------------------------------------------- environment metadata

test('supported environments agree, including coverage', async () => {
  const viaHttp = await http('/api/catalog/environments');
  const viaMcp = mcp('list_environments', {});

  assert.deepEqual(
    viaHttp.data.distros.map((d: any) => [d.distro, d.ecosystem]),
    viaMcp.distros.map((d: any) => [d.distro, d.ecosystem]),
  );
  assert.equal(viaMcp.detectionAvailable, false, 'MCP must not claim it can detect a system');

  // This test was named for coverage long before it checked any: MCP's
  // `list_environments` returned none at all, so a host could not tell a
  // well-covered distribution from one where the catalog has no native route —
  // the exact difference HTTP publishes coverage to expose. Both adapters
  // derive it from `resolveAll`, so they must agree entry for entry.
  assert.deepEqual(
    viaHttp.data.distros.map((d: any) => [d.distro, d.coverage]),
    viaMcp.distros.map((d: any) => [d.distro, d.coverage]),
    'coverage differs between adapters',
  );
  for (const entry of viaMcp.distros) {
    assert.equal(
      entry.coverage.installable + entry.coverage.manual + entry.coverage.unavailable,
      entry.coverage.total,
      `${entry.distro}: coverage does not account for every application`,
    );
  }
});

test('a resolution-only request describes itself the way every other endpoint does', async () => {
  // `POST /api/plan/resolve` used to shape its response inline in the
  // controller, which made it the one endpoint that described a resolution
  // differently from the rest — no `applicationName`, and no `considered`, on
  // the endpoint whose entire job is explaining resolution. Both now use the
  // installer's `presentResolution`.
  const applicationIds = ['git', 'cursor', 'firefox'];

  for (const distro of DISTROS) {
    const viaHttp = await http('/api/plan/resolve', { environment: { distro }, applicationIds });
    const viaMcp = mcp('check_compatibility', { applicationIds, environment: { distro } });

    assert.deepEqual(
      viaHttp.data.resolutions,
      viaMcp.resolutions,
      `${distro}: plan/resolve and check_compatibility describe resolutions differently`,
    );
  }
});
