import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { APPLICATIONS } from '@configshell/catalog';
import { SelectionList } from './SelectionList';
import { gsap, useGSAP, prefersReducedMotion, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

interface SelectionBarProps {
  selectedIds: Set<string>;
  onRemove: (id: string) => void;
  onClear: () => void;
  /** Null until a distribution is chosen — a plan cannot be built without one. */
  canContinue: boolean;
  blockedReason: string | null;
  onContinue: () => void;
}

/**
 * Sticky bottom bar, visible at every breakpoint. On small screens (where
 * the sidebar SelectionSummary is hidden) "View" opens the full list in a
 * sheet.
 *
 * "Continue" generates the setup plan. When it cannot — no distribution chosen,
 * or nothing selected — it stays disabled and the tooltip says which, rather
 * than being greyed out for an unstated reason.
 */
export function SelectionBar({
  selectedIds,
  onRemove,
  onClear,
  canContinue,
  blockedReason,
  onContinue,
}: SelectionBarProps) {
  const selectedApps = APPLICATIONS.filter((app) => selectedIds.has(app.id));
  const count = selectedApps.length;
  const barRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const prevCountRef = useRef(count);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !barRef.current) return;

      // Initial slide-up entrance
      gsap.fromTo(
        barRef.current,
        { y: '100%', opacity: 0 },
        {
          y: '0%',
          opacity: 1,
          duration: MOTION_DURATIONS.normal,
          ease: MOTION_EASINGS.subtle,
          clearProps: 'transform,opacity',
        },
      );
    },
    { scope: barRef },
  );

  useGSAP(
    () => {
      if (prefersReducedMotion() || prevCountRef.current === count || !countRef.current) {
        prevCountRef.current = count;
        return;
      }
      prevCountRef.current = count;

      gsap.fromTo(
        countRef.current,
        { opacity: 0.6, y: -2 },
        {
          opacity: 1,
          y: 0,
          duration: MOTION_DURATIONS.micro,
          ease: MOTION_EASINGS.subtle,
          clearProps: 'transform,opacity',
        },
      );
    },
    { dependencies: [count], scope: barRef },
  );

  return (
    <div ref={barRef} className="sticky bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-xs lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="min-w-0">
          <p ref={countRef} className="text-sm font-medium">
            {/* Short on phones, where the bar shares a row with two buttons. */}
            <span className="sm:hidden">{count} selected</span>
            <span className="hidden sm:inline">
              {count} application{count === 1 ? '' : 's'} selected
            </span>
          </p>
          {count > 0 && (
            <p className="truncate text-xs text-muted-foreground lg:hidden">
              {selectedApps.map((app) => app.name).join(', ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="lg:hidden" disabled={count === 0}>
                View
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Selected applications</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">
                <SelectionList selectedApps={selectedApps} onRemove={onRemove} />
                {count > 0 && (
                  <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={onClear}>
                    Clear all
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {canContinue ? (
            <Button type="button" onClick={onContinue}>
              <span className="sm:hidden">Build plan</span>
              <span className="hidden sm:inline">Build setup plan</span>
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Kept focusable and aria-disabled rather than `disabled`, so
                    the reason is reachable by keyboard and screen reader. */}
                <Button
                  type="button"
                  aria-disabled="true"
                  className="cursor-not-allowed opacity-60"
                  onClick={(event) => event.preventDefault()}
                >
                  <span className="sm:hidden">Build plan</span>
                  <span className="hidden sm:inline">Build setup plan</span>
                  <ArrowRight aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{blockedReason}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
