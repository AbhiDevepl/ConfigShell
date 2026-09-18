import { useCallback, useEffect, useState } from 'react';

export type LinuxDetectionState = 'linux' | 'not-linux' | 'unknown';

export interface LinuxDetection {
  state: LinuxDetectionState;
  /** Re-run the browser's environment signal on demand (e.g. "Detect again"). */
  redetect: () => void;
}

/**
 * The browser-only "is this Linux?" signal.
 *
 * Best-effort and explicit about what it is not: normal browser APIs do not
 * reliably expose which distribution is running (Ubuntu vs. Debian vs. Fedora
 * vs. Arch), so exact distribution must always be a manual choice (see
 * `src/components/environment/distros.ts` and `DistroSelector`). Real distro
 * detection is a future local-agent capability, not something this hook should
 * ever try to fake.
 *
 * `attempt` is a counter, not an input: the signal is deterministic for a
 * given environment, so detection is re-run on demand via `redetect` rather
 * than recomputed from changing data.
 */
export function useLinuxDetection(): LinuxDetection {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LinuxDetectionState>('unknown');

  useEffect(() => {
    setState(detectLinux());
  }, [attempt]);

  const redetect = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, redetect };
}

function detectLinux(): LinuxDetectionState {
  if (typeof navigator === 'undefined') return 'unknown';

  // Prefer the modern, structured signal where available (Chromium-based
  // browsers). Cast because userAgentData isn't in all lib.dom versions.
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData;
  if (uaData?.platform) {
    return uaData.platform.toLowerCase() === 'linux' ? 'linux' : 'not-linux';
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  // Android's UA/platform strings also contain "Linux" (it's Linux-based)
  // — exclude it so Android visitors aren't told they're "on Linux".
  if (/android/i.test(ua)) return 'not-linux';

  if (/linux/i.test(ua) || /linux/i.test(platform)) return 'linux';

  return 'not-linux';
}