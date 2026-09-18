import { Layers, X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import type { Application } from '@configshell/catalog';
import { CATEGORY_ICON } from '@/components/applications/categoryIcon';
import { gsap, useGSAP, shouldSkipEntrance, MOTION_DURATIONS, MOTION_EASINGS } from '@/lib/motion';

interface SelectionListProps {
  selectedApps: Application[];
  onRemove: (id: string) => void;
}

/** Shared list markup used by both the desktop sidebar and the mobile sheet. */
export function SelectionList({ selectedApps, onRemove }: SelectionListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(selectedApps.length);

  useGSAP(
    () => {
      if (shouldSkipEntrance() || !containerRef.current) return;

      if (selectedApps.length === 0) {
        const emptyEl = containerRef.current.querySelector('.selection-empty-state');
        if (emptyEl) {
          gsap.fromTo(
            emptyEl,
            { opacity: 0, y: 3 },
            {
              opacity: 1,
              y: 0,
              duration: MOTION_DURATIONS.micro,
              ease: MOTION_EASINGS.subtle,
              clearProps: 'transform',
            },
          );
        }
        prevCountRef.current = 0;
        return;
      }

      // If an item was just added, animate newly mounted item
      if (selectedApps.length > prevCountRef.current) {
        const lastItem = containerRef.current.querySelector('ul > li:last-child');
        if (lastItem) {
          gsap.fromTo(
            lastItem,
            { opacity: 0, y: 4 },
            {
              opacity: 1,
              y: 0,
              duration: MOTION_DURATIONS.micro,
              ease: MOTION_EASINGS.subtle,
              clearProps: 'transform',
            },
          );
        }
      }
      prevCountRef.current = selectedApps.length;
    },
    { dependencies: [selectedApps.length], scope: containerRef },
  );

  return (
    <div ref={containerRef}>
      {selectedApps.length === 0 ? (
        /*
         * The empty state carries the first step of the workflow, so it is the
         * one place in this panel that earns an icon and two lines of copy.
         * There is deliberately no "Browse applications" button: the catalog is
         * already on screen beside this panel, and a button that scrolls to
         * something visible is duplicate navigation. The sentence points at it
         * instead.
         */
        <Empty className="selection-empty-state gap-0 border border-dashed p-4">
          <EmptyHeader className="gap-1">
            <EmptyMedia variant="icon" className="mb-1 size-7">
              <Layers aria-hidden="true" className="size-3.5" />
            </EmptyMedia>
            <EmptyTitle className="text-xs font-medium">No applications selected yet</EmptyTitle>
            <EmptyDescription className="text-[11px] leading-snug">
              Choose applications from the catalog. They collect here, ready to become a
              setup plan.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        /*
          A plain max-height scroll region, the same way the catalog does it.
          Radix's ScrollArea was used here and did not constrain anything: its
          viewport is `height: 100%`, which against an auto-height parent
          resolves to auto, so the list grew straight through the `max-h-48` on
          the root and rendered on top of "Clear all" and the plan button once
          the selection passed about a dozen applications. `max-height` plus
          `overflow-y: auto` needs no such collaboration.

          No `tabIndex` on the region: every row holds a real remove button, so
          a keyboard user already reaches — and scrolls — the whole list.
        */
        <div className="max-h-48 overflow-y-auto">
          <ul className="flex flex-col gap-1.5 pr-1">
            {selectedApps.map((app) => {
              // The same mark the catalog card uses, so a row is recognisable
              // without repeating the card's name-plus-description weight.
              const Icon = CATEGORY_ICON[app.category];
              return (
                <li
                  key={app.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md bg-muted/60 px-2 py-1 text-xs"
                >
                  <Icon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{app.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemove(app.id)}
                    aria-label={`Remove ${app.name} from selected applications`}
                    className="size-5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
