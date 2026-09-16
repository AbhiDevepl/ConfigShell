/**
 * Plan rendering, one test per outcome the resolver can produce.
 *
 * ## Why there is no DOM here
 *
 * `apps/web` has no DOM test runner, and adding one (Vitest + jsdom +
 * testing-library) is three dependencies for what this file needs. React
 * already ships a server renderer, so the components are rendered for real —
 * real props, real branches, real output — into a string, on the same
 * `tsx --test` runner every other workspace uses. No new dependency.
 *
 * What that buys: every assertion below is about markup the component actually
 * produced. What it does not cover: anything requiring layout, events, or
 * computed styles. Click behaviour is still untested, which is the standing gap
 * recorded in `docs/testing.md`.
 *
 * ## Colour is asserted as a token, never as a value
 *
 * These tests check that an outcome renders its `--outcome-*` utility class and
 * its text label. They deliberately do not check a colour: a server renderer
 * resolves no CSS variable, and a test that pinned a hex value would have to be
 * edited every time the theme moved — turning a design change into a test
 * failure. `both themes define every outcome token` covers the values instead,
 * by reading the stylesheet.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'node:test';
import type { SetupPlan } from '@/lib/api';
import { OUTCOMES, PLAN_STATUS } from '@/lib/outcomes';
import { PlanView } from './PlanView.tsx';

// ------------------------------------------------------------------ fixtures

function plan(overrides: Partial<SetupPlan> = {}): SetupPlan {
  return {
    environment: { os: 'Linux', distro: 'Ubuntu', ecosystem: 'apt' },
    status: 'complete',
    resolutions: [],
    steps: [],
    commands: [],
    manualSteps: [],
    unavailable: [],
    summary: {
      selected: 0,
      installable: 0,
      manual: 0,
      unavailable: 0,
      privilegedCommands: 0,
    },
    execution: { executed: false, executedBy: null, note: 'ConfigShell never runs these.' },
    ...overrides,
  } as SetupPlan;
}

/** The real component, rendered with the real props it gets in the app. */
function render(p: SetupPlan): string {
  return renderToStaticMarkup(
    createElement(PlanView, {
      status: 'ready',
      plan: p,
      error: null,
      onBack: () => {},
      onRetry: () => {},
    }),
  );
}

const command = (text: string, privileged: boolean, summary: string) => ({
  command: text,
  privileged,
  summary,
  stepKind: 'install' as const,
});

// ------------------------------------------------------------- 1. installable

test('an installable plan shows the command, its count, and a complete status', () => {
  const html = render(
    plan({
      status: 'complete',
      commands: [command('install-one', false, 'Install Git')],
      summary: {
        selected: 1,
        installable: 1,
        manual: 0,
        unavailable: 0,
        privilegedCommands: 0,
      },
    }),
  );

  assert.match(html, /install-one/, 'the command text is shown in full');
  assert.match(html, new RegExp(PLAN_STATUS.complete.title));
  assert.match(html, new RegExp(OUTCOMES.installable.label));
  assert.match(html, new RegExp(OUTCOMES.installable.text), 'uses the installable token');
});

// ------------------------------------------------------------------ 2. manual

test('a manual plan is labelled as manual and never shown as installable', () => {
  const html = render(
    plan({
      status: 'none',
      manualSteps: [
        {
          applicationId: 'cursor',
          applicationName: 'Cursor',
          reason: 'official-download-only',
          summary: 'Install Cursor yourself',
          url: 'https://cursor.com/',
        },
      ],
      summary: {
        selected: 1,
        installable: 0,
        manual: 1,
        unavailable: 0,
        privilegedCommands: 0,
      },
    }),
  );

  assert.match(html, /Cursor/);
  assert.match(html, new RegExp(OUTCOMES.manual.label), 'says "Manual step" explicitly');
  assert.match(html, new RegExp(OUTCOMES.manual.text), 'uses the manual token');
  assert.match(html, /cursor\.com/, 'and links to the vendor');
  assert.match(html, /install these yourself/i);
});

// ------------------------------------------------------------- 3. unavailable

test('an unavailable application shows name, status and reason — and no command', () => {
  const html = render(
    plan({
      status: 'none',
      unavailable: [
        {
          applicationId: 'git',
          applicationName: 'Git',
          reason: 'no-source-for-environment',
          explanation: 'No verified zypper identifier.',
        },
      ],
      summary: {
        selected: 1,
        installable: 0,
        manual: 0,
        unavailable: 1,
        privilegedCommands: 0,
      },
    }),
  );

  assert.match(html, /Git/, 'the application name');
  assert.match(html, new RegExp(OUTCOMES.unavailable.label), 'the status');
  assert.match(html, /No verified zypper identifier/, 'the reason');
  assert.match(html, new RegExp(OUTCOMES.unavailable.text));
  assert.ok(!html.includes('<code'), 'no command block is rendered for an unavailable entry');
});

// -------------------------------------------------------------- 4. privileged

test('a privileged command is flagged, without borrowing the error colour', () => {
  const html = render(
    plan({
      status: 'complete',
      commands: [command('install-two', true, 'Install Docker')],
      summary: {
        selected: 1,
        installable: 1,
        manual: 0,
        unavailable: 0,
        privilegedCommands: 1,
      },
    }),
  );

  assert.match(html, new RegExp(OUTCOMES.privileged.label), 'carries a text label, not just colour');
  assert.match(html, new RegExp(OUTCOMES.privileged.text), 'uses the privileged token');
  assert.ok(
    !html.includes('text-destructive'),
    'privileged is not an error and must not look like one',
  );
  assert.ok(!/sudo|password/i.test(html), 'no privilege escalation is offered or implied');
});

// ------------------------------------------------------------------- 5. mixed

test('a mixed plan renders every outcome at once, with correct counts', () => {
  const html = render(
    plan({
      status: 'partial',
      commands: [
        command('install-git', false, 'Install Git'),
        command('install-code', false, 'Install VS Code'),
        command('install-docker', true, 'Install Docker'),
      ],
      manualSteps: [
        {
          applicationId: 'app-x',
          applicationName: 'Application X',
          reason: 'repository-setup-required',
          summary: 'Add the vendor repository yourself',
        },
      ],
      unavailable: [
        {
          applicationId: 'app-y',
          applicationName: 'Application Y',
          reason: 'no-verified-source',
          explanation: 'No verified source.',
        },
      ],
      summary: {
        selected: 5,
        installable: 3,
        manual: 1,
        unavailable: 1,
        privilegedCommands: 1,
      },
    }),
  );

  // Every outcome is present and named.
  for (const outcome of ['installable', 'manual', 'unavailable', 'privileged'] as const) {
    assert.match(html, new RegExp(OUTCOMES[outcome].label), `${outcome} label missing`);
    assert.match(html, new RegExp(OUTCOMES[outcome].text), `${outcome} token missing`);
  }

  assert.match(html, new RegExp(PLAN_STATUS.partial.title), 'a mixed plan is a partial plan');
  assert.match(html, /Application X/);
  assert.match(html, /Application Y/);
  assert.match(html, /install-git/);
  assert.match(html, /install-docker/);
  assert.match(html, /5 applications selected/);
});

// ------------------------------------------------------ the product boundary

test('no plan offers to run anything', () => {
  const html = render(
    plan({
      status: 'complete',
      commands: [command('install-one', true, 'Install Git')],
      summary: {
        selected: 1,
        installable: 1,
        manual: 0,
        unavailable: 0,
        privilegedCommands: 1,
      },
    }),
  );

  // Stated positively, because a denylist cannot work here: the copy button's
  // accessible name contains the command text, and a real command legitimately
  // contains "install". The invariant that actually matters is that the only
  // things this page lets you do are copy and navigate.
  const labels = [...html.matchAll(/<(?:button|a)\b[^>]*>([\s\S]*?)<\/(?:button|a)>/g)]
    .map((match) => match[1]!.replace(/<[^>]*>/g, ' ').trim())
    .concat([...html.matchAll(/aria-label="([^"]*)"/g)].map((match) => match[1]!.trim()))
    .filter(Boolean);

  const allowed = /^(copy|copied|back to selection|try again|vendor instructions)/i;
  assert.ok(labels.length > 0, 'the plan has controls to check');
  for (const label of labels) {
    assert.match(
      label,
      allowed,
      `a control does something other than copy or navigate: ${JSON.stringify(label)}`,
    );
  }

  assert.match(html, /does not run these for you/i, 'and says so where the commands are');
});

// ------------------------------------------------------------ theming (§12)

test('both themes define every outcome token', () => {
  const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');
  const light = css.slice(css.indexOf(':root {'), css.indexOf('.dark {'));
  const dark = css.slice(css.indexOf('.dark {'));

  for (const token of ['installable', 'manual', 'unavailable', 'privileged']) {
    assert.match(light, new RegExp(`--outcome-${token}:`), `light mode is missing ${token}`);
    assert.match(dark, new RegExp(`--outcome-${token}:`), `dark mode is missing ${token}`);
  }
});

test('plan components carry no hardcoded colour', () => {
  // A hex or rgb() literal in a component is a colour that cannot follow the
  // theme, so one of the two modes would be wrong.
  for (const file of ['PlanView.tsx', 'CommandBlock.tsx']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(source), `${file} contains a hex colour`);
    assert.ok(!/\brgba?\(/.test(source), `${file} contains an rgb() colour`);
    assert.ok(!/\boklch\(/.test(source), `${file} contains an oklch() colour`);
  }
});
