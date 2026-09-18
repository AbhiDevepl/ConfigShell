import { ArrowRight } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        {/*
          A badge rather than a third line of grey text: the count is a status,
          and giving it its own weight is what stops the heading, the count and
          the empty-state title from all reading as the same thing. It stays a
          live region so the number is announced when it changes, and the word
          "selected" stays in the text so it is not a bare number to a screen
          reader.
        */}
        <Badge
          ref={countRef}
          variant={selectedApps.length > 0 ? 'secondary' : 'outline'}
          className="h-5 shrink-0 px-1.5 text-[11px] font-medium tabular-nums"
          aria-live="polite"
        >
          {selectedApps.length} selected
        </Badge>
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

        {/*
          The primary action only exists once something is selected. With an
          empty selection there is nothing to build, and a permanently disabled
          button under an empty list says less than the empty state above it
          already does.

          It still renders disabled-with-a-reason for the *other* blocker — a
          selection but no distribution — because there the user has done
          something and deserves to be told what is missing.
        */}
        {selectedApps.length > 0 && onContinue && (
          <>
            <Separator className="my-0.5" />
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

            {/* The standing promise, kept next to the button that is about to
                produce commands — where it is actually load-bearing. */}
            <p className="text-[11px] leading-tight text-muted-foreground">
              ConfigShell never installs anything itself — you get the commands and run
              them yourself.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
