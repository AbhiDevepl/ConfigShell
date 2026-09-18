/**
 * Selection panel rendering, one test per state the panel can be in.
 *
 * ## Why there is no DOM here
 *
 * Same reason as `components/plan/PlanView.test.ts`: `apps/web` has no DOM test
 * runner, and React's server renderer covers everything this file needs —
 * real props, real branches, real markup — on the `tsx --test` runner every
 * other workspace already uses. No new dependency.
 *
 * What that buys: the empty state, the count, the rows and the gating of the
 * primary action are all asserted against markup the component actually
 * produced. What it does not cover: clicking. `onRemove` and `onClear` are
 * asserted to be *wired to the right application* by their accessible labels,
 * not by being fired — that remains the standing gap in `docs/testing.md`.
 */

import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { test } from 'node:test';
import { APPLICATIONS } from '@configshell/catalog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SelectionSummary } from './SelectionSummary.tsx';

// ------------------------------------------------------------------ fixtures

/** Real catalog ids, so a rename in the catalog fails here rather than lying. */
const ids = (n: number) => APPLICATIONS.slice(0, n).map((app) => app.id);
const names = (n: number) => APPLICATIONS.slice(0, n).map((app) => app.name);

function render(
  selected: string[],
  options: { canContinue?: boolean; blockedReason?: string | null } = {},
): string {
  return renderToStaticMarkup(
    createElement(
      TooltipProvider,
      null,
      createElement(SelectionSummary, {
        selectedIds: new Set(selected),
        onRemove: () => {},
        onClear: () => {},
        canContinue: options.canContinue ?? selected.length > 0,
        blockedReason: options.blockedReason ?? null,
        onContinue: () => {},
      }),
    ),
  );
}

// -------------------------------------------------------------- 1. empty (0)

test('the empty state names the next step and offers no primary action', () => {
  const html = render([]);

  assert.match(html, /Selected applications/, 'the panel still names itself');
  assert.match(html, /0 selected/, 'and reports the count');
  assert.match(html, /No applications selected yet/, 'the empty state has its own title');
  assert.match(html, /Choose applications from the catalog/, 'and says what to do');

  // §9: nothing to build a plan from, so no plan button — the empty state
  // above it already carries the instruction.
  assert.ok(!html.includes('Build setup plan'), 'an empty panel offers no primary action');
  assert.ok(!html.includes('Clear all'), 'and nothing to clear');
});

test('the empty state is not communicated by colour alone', () => {
  // The icon is decorative; the title and description carry the meaning.
  const html = render([]);
  assert.match(html, /aria-hidden="true"/, 'the empty-state icon is hidden from AT');
  assert.match(html, /No applications selected yet[\s\S]*Choose applications/, 'text carries it');
});

// ----------------------------------------------------------------- 2. one (1)

test('one selected application renders as one row with a named remove control', () => {
  const [id] = ids(1);
  const [name] = names(1);
  const html = render([id!]);

  assert.match(html, /1 selected/, 'the count is singular-correct as a number');
  assert.match(html, new RegExp(name!), 'the application is listed by name');
  assert.match(
    html,
    new RegExp(`Remove ${name!} from selected applications`),
    'the remove control says which application it removes',
  );
  assert.ok(!html.includes('No applications selected yet'), 'the empty state is gone');
});

// --------------------------------------------------------------- 3. three (3)

test('three selected applications render three rows, and the actions appear', () => {
  const html = render(ids(3));

  assert.match(html, /3 selected/);
  for (const name of names(3)) {
    assert.match(html, new RegExp(name), `${name} is missing from the panel`);
  }
  assert.match(html, /Clear all/, 'clearing is offered once there is something to clear');
  assert.match(html, /Build setup plan/, 'and the primary action is available');
});

test('the panel lists names only — it does not repeat the catalog card', () => {
  const html = render(ids(3));
  for (const app of APPLICATIONS.slice(0, 3)) {
    assert.ok(
      !html.includes(app.description),
      `${app.name}'s description belongs in the catalog, not the selection panel`,
    );
  }
});

// ------------------------------------------------------------- 4. many (10+)

test('a large selection stays inside a bounded, scrollable area', () => {
  const many = ids(12);
  assert.equal(many.length, 12, 'the catalog must have enough entries for this test');
  const html = render(many);

  assert.match(html, /12 selected/);
  for (const name of names(12)) {
    assert.match(html, new RegExp(name), `${name} is missing — nothing may be silently dropped`);
  }
  // §8: the panel must not grow without limit. Asserted as the constraint
  // rather than a pixel value, which is a design choice that may move.
  assert.match(html, /max-h-\d+/, 'the list has no height ceiling');
});

// ------------------------------------------------------ 5. the blocked action

test('a selection without a distribution keeps the button and states the reason', () => {
  const reason = 'Choose your distribution first — commands depend on it.';
  const html = render(ids(2), { canContinue: false, blockedReason: reason });

  assert.match(html, /Build setup plan/, 'the action stays visible once something is selected');
  assert.match(html, /aria-disabled="true"/, 'but is disabled');
  assert.match(html, new RegExp(reason.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), 'and says why');
});

// ------------------------------------------------------ the product boundary

test('the panel never offers to install anything', () => {
  const html = render(ids(3));

  const labels = [...html.matchAll(/<(?:button|a)\b[^>]*>([\s\S]*?)<\/(?:button|a)>/g)]
    .map((match) => match[1]!.replace(/<[^>]*>/g, ' ').trim())
    .concat([...html.matchAll(/aria-label="([^"]*)"/g)].map((match) => match[1]!.trim()))
    .filter(Boolean);

  const allowed = /^(clear all|build setup plan|remove .+ from selected applications)$/i;
  assert.ok(labels.length > 0, 'the panel has controls to check');
  for (const label of labels) {
    assert.match(label, allowed, `unexpected control in the selection panel: ${JSON.stringify(label)}`);
  }
});
