/**
 * API client tests.
 *
 * Node's built-in runner via `tsx` — the same runner the other workspaces use.
 * No DOM and no component rendering here: this file covers the client's
 * contract with the server, which is the part that can be wrong in ways a
 * screenshot would not show.
 *
 * `fetch` is stubbed rather than mocked through a library, because the thing
 * being tested is how this module reacts to responses, not how it calls fetch.
 */

import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { ApiRequestError, createPlan } from './api.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Stub fetch with a fixed response, capturing the request for inspection. */
function stubFetch(
  response: { status?: number; body?: unknown; bodyText?: string } | Error,
): { calls: { url: string; init?: RequestInit }[] } {
  const calls: { url: string; init?: RequestInit }[] = [];

  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    if (response instanceof Error) throw response;

    const { status = 200, body, bodyText } = response;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (bodyText !== undefined) return JSON.parse(bodyText); // throws for bad text
        return body;
      },
    } as Response;
  }) as typeof fetch;

  return { calls };
}

test('a successful response is unwrapped from its data envelope', async () => {
  stubFetch({ body: { data: { commands: [{ command: 'sudo apt-get update' }] } } });
  const plan = await createPlan(['git'], 'Ubuntu');
  assert.equal(plan.commands[0]!.command, 'sudo apt-get update');
});

test('the request carries catalog ids and a distribution — and nothing else', async () => {
  // The security property the server's validator relies on, asserted from this
  // side too: there is no field here through which a package name, a flag or a
  // command could be sent.
  const { calls } = stubFetch({ body: { data: {} } });
  await createPlan(['git', 'htop'], 'Fedora');

  assert.equal(calls.length, 1);
  assert.equal(calls[0]!.url, '/api/plan');
  assert.equal(calls[0]!.init?.method, 'POST');

  const sent = JSON.parse(String(calls[0]!.init?.body));
  assert.deepEqual(Object.keys(sent).sort(), ['applicationIds', 'environment']);
  assert.deepEqual(sent.applicationIds, ['git', 'htop']);
  assert.deepEqual(Object.keys(sent.environment), ['distro']);
  assert.equal(sent.environment.distro, 'Fedora');
});

test('a rejected request surfaces the server’s code and message', async () => {
  stubFetch({
    status: 422,
    body: {
      error: {
        code: 'UNKNOWN_APPLICATION',
        message: 'One or more application ids are not in the catalog.',
        details: { unknown: ['nope'] },
      },
    },
  });

  await assert.rejects(
    () => createPlan(['nope'], 'Ubuntu'),
    (error: ApiRequestError) => {
      assert.equal(error.kind, 'rejected');
      assert.equal(error.code, 'UNKNOWN_APPLICATION');
      assert.match(error.message, /not in the catalog/);
      assert.equal(error.retryable, false, 'a bad request should not offer a retry');
      return true;
    },
  );
});

test('a network failure is reported as offline, and is retryable', async () => {
  stubFetch(new TypeError('Failed to fetch'));
  await assert.rejects(
    () => createPlan(['git'], 'Ubuntu'),
    (error: ApiRequestError) => {
      assert.equal(error.kind, 'offline');
      assert.equal(error.retryable, true);
      return true;
    },
  );
});

test('a 5xx with an unreadable body is offline, not "malformed"', async () => {
  // This is what a dev proxy returns when nothing is listening upstream.
  // Calling it a malformed response would send the reader looking in the wrong
  // place; calling it offline points at the actual fix.
  stubFetch({ status: 500, bodyText: '<html>proxy error</html>' });
  await assert.rejects(
    () => createPlan(['git'], 'Ubuntu'),
    (error: ApiRequestError) => {
      assert.equal(error.kind, 'offline');
      assert.equal(error.retryable, true);
      return true;
    },
  );
});

test('a 5xx with a proper error envelope is a server error, and is retryable', async () => {
  stubFetch({ status: 500, body: { error: { code: 'INTERNAL', message: 'Internal server error.' } } });
  await assert.rejects(
    () => createPlan(['git'], 'Ubuntu'),
    (error: ApiRequestError) => {
      assert.equal(error.kind, 'server');
      assert.equal(error.retryable, true);
      return true;
    },
  );
});

test('a 2xx that is not JSON, or has no data, is malformed', async () => {
  stubFetch({ status: 200, bodyText: 'not json at all' });
  await assert.rejects(
    () => createPlan(['git'], 'Ubuntu'),
    (error: ApiRequestError) => error.kind === 'malformed',
  );

  stubFetch({ status: 200, body: { something: 'else' } });
  await assert.rejects(
    () => createPlan(['git'], 'Ubuntu'),
    (error: ApiRequestError) => error.kind === 'malformed',
  );
});

test('a 4xx without a usable message still produces a readable error', async () => {
  stubFetch({ status: 404, body: {} });
  await assert.rejects(
    () => createPlan(['git'], 'Ubuntu'),
    (error: ApiRequestError) => {
      assert.equal(error.kind, 'rejected');
      assert.match(error.message, /HTTP 404/);
      return true;
    },
  );
});
