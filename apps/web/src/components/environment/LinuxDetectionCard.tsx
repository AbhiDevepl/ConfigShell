import { CircleHelp, Laptop, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useLinuxDetection } from '@/hooks/useLinuxDetection';
import { gsap, useGSAP, prefersReducedMotion, shouldSkipEntrance, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

/**
 * Browser-only "does this look like Linux" indicator. Never attempts to
 * name a specific distribution — see useLinuxDetection for why that isn't
 * reliably possible from a browser.
 */
export function LinuxDetectionCard() {
  const state = useLinuxDetection();
  const [checking, setChecking] = useState(() => !prefersReducedMotion());
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!checking) return;
    const timer = setTimeout(() => {
      setChecking(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [checking]);

  useGSAP(
    () => {
      if (checking || shouldSkipEntrance()) return;
      if (!cardRef.current) return;

      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.97, y: 3 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: MOTION_DURATIONS.feedback,
          ease: MOTION_EASINGS.subtle,
          clearProps: 'transform',
        },
      );
    },
    { dependencies: [checking, state], scope: cardRef },
  );

  if (checking) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground"
      >
        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
        <span>Detecting environment…</span>
      </div>
    );
  }

  if (state === 'linux') {
    return (
      <div
        ref={cardRef}
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-xs text-foreground"
      >
        <Laptop className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="font-medium">Linux detected</span>
        <Badge variant="secondary" className="h-4 px-1 text-[10px] font-normal">
          Browser signal
        </Badge>
        <span className="hidden text-muted-foreground sm:inline">
          — running on Linux
        </span>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-foreground"
    >
      <CircleHelp className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="font-medium">Linux unconfirmed</span>
      <span className="hidden text-muted-foreground sm:inline">
        {state === 'not-linux'
          ? "Doesn't look like Linux. Choose manually."
          : 'Insufficient signal. Choose manually.'}
      </span>
    </div>
  );
}
