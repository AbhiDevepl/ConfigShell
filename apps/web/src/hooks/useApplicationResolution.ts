import { useEffect, useRef, useState } from 'react';
import { ApiRequestError, fetchApplicationResolution, type PlanResolution } from '@/lib/api';
import type { Distro } from '@configshell/catalog';

export type ResolutionStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Ask the API how one application resolves for one distribution.
 *
 * The web app deliberately does **not** compute this itself. Which sources
 * apply, and which one wins, is resolver policy — including rules the UI has no
 * business knowing, such as "a vendor package-manager source needs a repository
 * added first and is therefore not usable". An earlier version of this screen
 * re-derived applicability locally and got it wrong: it highlighted VS Code's
 * `apt` source as applying to Ubuntu while the plan quietly installed the Snap
 * instead.
 *
 * One answer, from one place, even though it costs a request.
 */
export function useApplicationResolution(applicationId: string | null, distro: Distro | null) {
  const [status, setStatus] = useState<ResolutionStatus>('idle');
  const [resolution, setResolution] = useState<PlanResolution | null>(null);
  const [error, setError] = useState<ApiRequestError | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;

    if (!applicationId || !distro) {
      setStatus('idle');
      setResolution(null);
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    fetchApplicationResolution(applicationId, distro)
      .then((result) => {
        if (id !== requestId.current) return;
        setResolution(result);
        setStatus('ready');
      })
      .catch((cause: unknown) => {
        if (id !== requestId.current) return;
        setResolution(null);
        setError(
          cause instanceof ApiRequestError
            ? cause
            : new ApiRequestError('server', 'Could not load installation details.'),
        );
        setStatus('error');
      });
  }, [applicationId, distro]);

  return { status, resolution, error };
}
