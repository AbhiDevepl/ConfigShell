import { useCallback, useEffect, useRef, useState } from 'react';

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Copy-to-clipboard with visible, honest feedback.
 *
 * The Clipboard API needs a secure context and a user gesture, and it can be
 * blocked outright by permissions policy. When it fails the caller is told so
 * it can show the command for manual selection instead — silently pretending a
 * copy worked is worse than not offering one.
 *
 * There is no `document.execCommand` fallback: it is deprecated, and the
 * manual-selection path is a better answer than a second unreliable one.
 */
export function useClipboard(resetAfterMs = 2000) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      clearTimeout(timer.current);
      try {
        if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(text);
        setState('copied');
      } catch {
        setState('failed');
      }
      timer.current = setTimeout(() => setState('idle'), resetAfterMs);
    },
    [resetAfterMs],
  );

  return { state, copy };
}
