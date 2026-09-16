import { useCallback, useRef, useState } from 'react';
import { ApiRequestError, createPlan, type SetupPlan } from '@/lib/api';
import type { Distro } from '@configshell/catalog';

export type PlanStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Requests a setup plan from the API and exposes it as an explicit state
 * machine, so every outcome has somewhere to be rendered: nothing requested
 * yet, in flight, a plan, or a failure the user can act on.
 *
 * Deliberately has no fallback path. If the API is unreachable the UI says so
 * and offers a retry — it does not quietly generate a plan in the browser
 * instead. Two implementations of command generation is exactly the situation
 * `packages/installer` exists to prevent, and a user who is shown commands has
 * a right to know where they came from.
 */
export function useSetupPlan() {
  const [status, setStatus] = useState<PlanStatus>('idle');
  const [plan, setPlan] = useState<SetupPlan | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);

  // Guards against a slow earlier request resolving after a newer one and
  // overwriting it — a stale plan for a distribution the user has moved on from
  // would be actively misleading.
  const requestId = useRef(0);

  const generate = useCallback(async (applicationIds: string[], distro: Distro) => {
    const id = ++requestId.current;
    setStatus('loading');
    setError(null);

    try {
      const result = await createPlan(applicationIds, distro);
      if (id !== requestId.current) return;
      setPlan(result);
      setStatus('ready');
    } catch (cause) {
      if (id !== requestId.current) return;
      setPlan(null);
      setError(
        cause instanceof ApiRequestError
          ? cause
          : new ApiRequestError('server', 'Something went wrong generating the plan.'),
      );
      setStatus('error');
    }
  }, []);

  /** Drop the current plan — used when the selection or environment changes. */
  const reset = useCallback(() => {
    requestId.current += 1;
    setStatus('idle');
    setPlan(null);
    setError(null);
  }, []);

  return { status, plan, error, generate, reset };
}
