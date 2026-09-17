import { useMemo } from 'react';

export type LinuxDetectionState = 'linux' | 'not-linux' | 'unknown';

/**
 * Best-effort, browser-only signal for whether the visitor is on Linux.
 *
 * This intentionally stops at "is this Linux" — normal browser APIs do not
 * reliably expose which distribution is running (Ubuntu vs. Debian vs.
 * Fedora vs. Arch), so exact distribution must always be a manual choice
 * (see `src/components/environment/distros.ts` and `DistroSelector`). Real distro detection
 * is a future local-agent capability, not something this hook should ever
 * try to fake.
 */
export function useLinuxDetection(): LinuxDetectionState {
  return useMemo(() => {
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
  }, []);
}
