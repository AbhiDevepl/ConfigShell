import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { APPLICATIONS } from '@configshell/catalog';
import { SelectionList } from './SelectionList';
import { gsap, useGSAP, prefersReducedMotion, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

interface SelectionSummaryProps {
  selectedIds: Set<string>;
  onRemove: (id: string) => void;
  onClear: () => void;
  canContinue?: boolean;
  blockedReason?: string | null;
  onContinue?: () => void;
}

/** Desktop sidebar summary — hidden on small screens in favor of the sticky bottom bar. */
export function SelectionSummary({
  selectedIds,
  onRemove,
  onClear,
  canContinue = false,
  blockedReason = null,
  onContinue,
}: SelectionSummaryProps) {
  const selectedApps = APPLICATIONS.filter((app) => selectedIds.has(app.id));
  const cardRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const prevCountRef = useRef(selectedApps.length);
  const prevCanContinueRef = useRef(canContinue);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      // Animate count badge when number of selected apps changes
      if (prevCountRef.current !== selectedApps.length && countRef.current) {
        gsap.fromTo(
          countRef.current,
          { opacity: 0.5, y: -3 },
          {
            opacity: 1,
            y: 0,
            duration: MOTION_DURATIONS.micro,
            ease: MOTION_EASINGS.subtle,
            clearProps: 'transform,opacity',
          },
        );
        prevCountRef.current = selectedApps.length;
      }

      // Animate continue button state transition (disabled -> enabled)
      if (prevCanContinueRef.current !== canContinue) {
        prevCanContinueRef.current = canContinue;
        const btn = cardRef.current?.querySelector('.build-plan-button');
        if (btn && canContinue) {
          gsap.fromTo(
            btn,
            { scale: 0.98 },
            {
              scale: 1,
              duration: MOTION_DURATIONS.feedback,
              ease: MOTION_EASINGS.subtle,
              clearProps: 'transform',
            },
          );
        }
      }
    },
    { dependencies: [selectedApps.length, canContinue], scope: cardRef },
  );

  return (
    <Card ref={cardRef} className="hidden lg:block border-border shadow-xs">
      <CardHeader className="flex-row items-center justify-between p-3.5 pb-2">
        <CardTitle className="text-sm font-semibold">Selected applications</CardTitle>
        <span
          ref={countRef}
          className="text-xs font-medium text-muted-foreground inline-block"
          aria-live="polite"
        >
          {selectedApps.length} selected
        </span>
      </CardHeader>

      <CardContent className="p-3.5 pt-1 flex flex-col gap-2.5">
        <SelectionList selectedApps={selectedApps} onRemove={onRemove} />

        {selectedApps.length > 0 && (
          <div className="flex items-center justify-end">
            <Button type="button" variant="ghost" size="xs" onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">
              Clear all
            </Button>
          </div>
        )}

        <Separator className="my-0.5" />

        {onContinue && (
          <div>
            {canContinue ? (
              <Button type="button" onClick={onContinue} className="build-plan-button w-full justify-center transition-colors">
                <span>Build setup plan</span>
                <ArrowRight aria-hidden="true" className="ml-1 size-3.5" />
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block w-full">
                    <Button
                      type="button"
                      aria-disabled="true"
                      className="build-plan-button w-full justify-center cursor-not-allowed opacity-60 transition-opacity"
                      onClick={(event) => event.preventDefault()}
                    >
                      <span>Build setup plan</span>
                      <ArrowRight aria-hidden="true" className="ml-1 size-3.5" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{blockedReason}</TooltipContent>
              </Tooltip>
            )}
            {!canContinue && blockedReason && (
              <p className="mt-1.5 text-[11px] text-muted-foreground text-center">
                {blockedReason}
              </p>
            )}
          </div>
        )}

        <p className="border-t border-border pt-2 text-[11px] text-muted-foreground leading-tight">
          Choose a distribution, then build the setup plan to see the exact commands.
          ConfigShell never installs anything itself.
        </p>
      </CardContent>
    </Card>
  );
}
